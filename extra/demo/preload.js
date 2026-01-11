const { contextBridge, ipcRenderer, shell } = require("electron");
const os = require("os");
const path = require("path");
const { DateTime } = require("luxon");
const {
  GROUP_IDS,
  DEMO_USER,
  PROFILE_LOCKS,
  EVENT_BEHAVIORS,
  HOURLY_HISTORY_SEED,
  DEMO_IMAGE_URL,
  createDemoStore,
  buildEventTimes,
  generateDateOptionsFromPatterns
} = require("./demo-data");

const pkg = (() => {
  try {
    return require(path.join(__dirname, "..", "..", "package.json"));
  } catch (err) {
    return { version: "0.0.0" };
  }
})();

process.on("uncaughtException", err => {
  try {
    ipcRenderer.send("demo:preload-error", err?.stack || err?.message || String(err));
  } catch {
    // Ignore IPC errors in preload.
  }
});

process.on("unhandledRejection", err => {
  try {
    ipcRenderer.send("demo:preload-error", err?.stack || err?.message || String(err));
  } catch {
    // Ignore IPC errors in preload.
  }
});

let storeInitError = null;
let store = null;
try {
  store = createDemoStore();
} catch (err) {
  storeInitError = err;
  try {
    ipcRenderer.send("demo:preload-error", err?.stack || err?.message || String(err));
  } catch {
    // Ignore IPC errors in preload.
  }
  store = {
    groups: [],
    profiles: {},
    events: {},
    pendingEvents: {},
    rateLimitServerEvents: [],
    gallery: [],
    galleryMap: {},
    rolesByGroup: {},
    settings: {
      warnConflicts: true,
      minimizeToTray: false,
      trayPromptShown: true
    },
    themeStore: {
      selectedPreset: "default",
      customColors: null
    },
    themePresets: [],
    pendingSettings: {
      displayLimit: 10
    },
    updateState: {
      available: false,
      downloaded: false,
      downloading: false,
      progress: 0,
      version: null
    },
    counters: {
      event: 1,
      profile: 1,
      upload: 1
    },
    galleryUploadIndex: 0
  };
}
let currentUser = null;
let autoLoginEnabled = true;
let pendingTwoFactor = null;
let updateTimer = null;

const twoFactorListeners = [];
const updateReadyListeners = [];
const updateProgressListeners = [];
const automationMissedListeners = [];
const automationCreatedListeners = [];

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedDemoStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
      const now = Date.now();
      const history = {};
      const createdIds = {};
      Object.entries(HOURLY_HISTORY_SEED).forEach(([groupId, count]) => {
        const key = `${DEMO_USER.id}::${groupId}`;
        const entries = [];
        const ids = [];
        for (let i = 0; i < count; i += 1) {
          const ts = now - ((i + 1) * 5 * 60 * 1000);
          entries.push(ts);
          ids.push({ id: `demo-seed-${groupId}-${i + 1}`, timestamp: ts });
        }
        history[key] = entries;
        createdIds[key] = ids;
      });
      localStorage.setItem("vrc-event-hourly-history-v1", JSON.stringify(history));
      localStorage.setItem("vrc-event-created-ids-v1", JSON.stringify(createdIds));
    }
  } catch (err) {
    // Ignore storage errors in demo.
  }
}

seedDemoStorage();

function emit(listeners, payload) {
  listeners.forEach(callback => {
    try {
      callback(payload);
    } catch (err) {
      // Ignore callback failures.
    }
  });
}

function getGalleryFile(imageId) {
  return store.galleryMap[imageId] || null;
}

function nextEventId() {
  const id = `demo-event-${store.counters.event}`;
  store.counters.event += 1;
  return id;
}

function nextUploadId() {
  const id = `file_demo_upload_${store.counters.upload}`;
  store.counters.upload += 1;
  return id;
}

function normalizeEventData(groupId, eventData, startsAtUtc, endsAtUtc) {
  const createdAt = DateTime.utc();
  const durationMinutes = Math.max(1, Math.round(
    DateTime.fromISO(endsAtUtc).diff(DateTime.fromISO(startsAtUtc), "minutes").minutes
  ));
  const imageId = eventData?.imageId || null;
  const imageUrl = imageId && getGalleryFile(imageId) ? getGalleryFile(imageId).previewUrl : null;
  return {
    id: nextEventId(),
    groupId,
    title: eventData?.title || "Untitled Event",
    description: eventData?.description || "",
    category: eventData?.category || "hangout",
    accessType: eventData?.accessType || "public",
    languages: Array.isArray(eventData?.languages) ? eventData.languages : [],
    platforms: Array.isArray(eventData?.platforms) ? eventData.platforms : [],
    tags: Array.isArray(eventData?.tags) ? eventData.tags : [],
    roleIds: Array.isArray(eventData?.roleIds) ? eventData.roleIds : [],
    imageId,
    imageUrl,
    startsAtUtc,
    endsAtUtc,
    createdAtUtc: createdAt.toISO(),
    durationMinutes,
    timezone: eventData?.timezone || "UTC"
  };
}

function getConflictTitle() {
  const conflictEvents = store.events[GROUP_IDS.conflict] || [];
  return conflictEvents.length ? conflictEvents[0].title : "Conflict Event";
}

function getPendingEventsForGroup(groupId) {
  return store.pendingEvents[groupId] || [];
}

function updatePendingCounts(events) {
  const missedCount = events.filter(event => event.status === "missed").length;
  const queuedCount = events.filter(event => event.status === "queued").length;
  return { missedCount, queuedCount };
}

function scheduleUpdateProgress() {
  if (updateTimer) {
    return;
  }
  updateTimer = setInterval(() => {
    store.updateState.progress = Math.min(100, store.updateState.progress + 20);
    emit(updateProgressListeners, { percent: store.updateState.progress });
    if (store.updateState.progress >= 100) {
      store.updateState.downloading = false;
      store.updateState.downloaded = true;
      clearInterval(updateTimer);
      updateTimer = null;
      emit(updateReadyListeners, { version: store.updateState.version || "DEMO" });
    }
  }, 400);
}

async function login({ username, password }) {
  const safeUsername = String(username || "").trim();
  const safePassword = String(password || "").trim();
  if (!safeUsername || !safePassword) {
    throw new Error("Missing credentials.");
  }
  const lower = safeUsername.toLowerCase();
  if (lower.includes("fail")) {
    throw new Error("Login failed.");
  }
  const user = {
    ...DEMO_USER,
    displayName: safeUsername.includes("@") ? safeUsername.split("@")[0] : safeUsername
  };
  if (lower.includes("2fa")) {
    return await new Promise(resolve => {
      pendingTwoFactor = { resolve, user };
      emit(twoFactorListeners);
    });
  }
  currentUser = user;
  return { user };
}

async function submitTwoFactor() {
  if (!pendingTwoFactor) {
    return false;
  }
  currentUser = pendingTwoFactor.user;
  pendingTwoFactor.resolve({ user: currentUser });
  pendingTwoFactor = null;
  return true;
}

contextBridge.exposeInMainWorld("vrcEvent", {
  isDemo: true,
  demoInitError: storeInitError ? (storeInitError.stack || storeInitError.message || String(storeInitError)) : null,
  setDemoUpdateAvailable: async value => {
    store.updateState.available = Boolean(value);
    store.updateState.downloaded = false;
    store.updateState.downloading = false;
    store.updateState.progress = 0;
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
    return deepClone(store.updateState);
  },
  getCurrentUser: async () => {
    if (!currentUser && autoLoginEnabled) {
      currentUser = { ...DEMO_USER };
    }
    return currentUser;
  },
  login,
  logout: async () => {
    currentUser = null;
    autoLoginEnabled = false;
  },
  onTwoFactorRequired: callback => {
    if (typeof callback === "function") {
      twoFactorListeners.push(callback);
    }
  },
  submitTwoFactor,
  getGroups: async () => deepClone(store.groups),
  getGroupRoles: async ({ groupId } = {}) => deepClone(store.rolesByGroup[groupId] || []),
  getProfiles: async () => deepClone(store.profiles),
  createProfile: async payload => {
    const { groupId, profileKey, data } = payload || {};
    if (!groupId || !profileKey || !data) {
      throw new Error("Missing profile data.");
    }
    if (groupId !== GROUP_IDS.custom) {
      throw new Error("Profiles are locked in demo groups.");
    }
    if (!store.profiles[groupId]) {
      store.profiles[groupId] = { groupId, groupName: "Custom Sandbox", profiles: {} };
    }
    store.profiles[groupId].profiles[profileKey] = { ...data };
  },
  updateProfile: async payload => {
    const { groupId, profileKey, data } = payload || {};
    if (!groupId || !profileKey || !data) {
      throw new Error("Missing profile data.");
    }
    const lockMode = PROFILE_LOCKS[groupId] || "open";
    const group = store.profiles[groupId];
    if (!group || !group.profiles[profileKey]) {
      throw new Error("Profile not found.");
    }
    if (lockMode === "immutable") {
      return;
    }
    if (lockMode === "automation-only") {
      group.profiles[profileKey] = {
        ...group.profiles[profileKey],
        automation: data.automation
      };
      return;
    }
    group.profiles[profileKey] = { ...data };
  },
  deleteProfile: async payload => {
    const { groupId, profileKey } = payload || {};
    if (!groupId || !profileKey) {
      throw new Error("Missing profile data.");
    }
    if (groupId !== GROUP_IDS.custom) {
      throw new Error("Profiles are locked in demo groups.");
    }
    const group = store.profiles[groupId];
    if (!group || !group.profiles[profileKey]) {
      throw new Error("Profile not found.");
    }
    delete group.profiles[profileKey];
  },
  getDateOptions: async payload => {
    const { patterns, monthsAhead, timezone } = payload || {};
    return generateDateOptionsFromPatterns(patterns || [], monthsAhead || 6, timezone || "UTC");
  },
  prepareEvent: async payload => {
    const { groupId } = payload || {};
    const times = buildEventTimes(payload || {});
    const behavior = EVENT_BEHAVIORS[groupId];
    return {
      startsAtUtc: times.startsAtUtc,
      endsAtUtc: times.endsAtUtc,
      conflictEvent: behavior === "conflict" ? { title: getConflictTitle() } : null
    };
  },
  createEvent: async payload => {
    const { groupId, startsAtUtc, endsAtUtc, eventData } = payload || {};
    if (!groupId || !startsAtUtc || !endsAtUtc) {
      return { ok: false, error: { message: "Missing event data." } };
    }
    if (EVENT_BEHAVIORS[groupId] === "rate-limit") {
      return {
        ok: false,
        error: { status: 429, code: "UPCOMING_LIMIT", message: "Rate limited." }
      };
    }
    const eventId = nextEventId();
    const event = normalizeEventData(groupId, eventData, startsAtUtc, endsAtUtc);
    event.id = eventId;
    if (!store.events[groupId]) {
      store.events[groupId] = [];
    }
    store.events[groupId].push(event);
    return { ok: true, eventId };
  },
  getUpcomingEventCount: async payload => {
    const { groupId } = payload || {};
    if (!groupId) {
      throw new Error("Missing group.");
    }
    const now = Date.now();
    const events = store.events[groupId] || [];
    const count = events.filter(event => Date.parse(event.startsAtUtc) >= now).length;
    return { count, limit: 10 };
  },
  listGroupEvents: async payload => {
    const { groupId, upcomingOnly = true, includeNonEditable = false } = payload || {};
    if (!groupId) {
      throw new Error("Missing group.");
    }
    const now = Date.now();
    let events = deepClone(store.events[groupId] || []);
    if (includeNonEditable && groupId === GROUP_IDS.rate) {
      events = events.concat(deepClone(store.rateLimitServerEvents));
    }
    if (upcomingOnly) {
      events = events.filter(event => Date.parse(event.startsAtUtc || event.endsAtUtc) >= now);
    }
    events.sort((a, b) => {
      const aTime = Date.parse(a.startsAtUtc || a.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      const bTime = Date.parse(b.startsAtUtc || b.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
    return events;
  },
  updateEvent: async payload => {
    const { groupId, eventId, eventData, timezone, durationMinutes, manualDate, manualTime } = payload || {};
    if (!groupId || !eventId || !eventData) {
      return { ok: false, error: { message: "Missing event data." } };
    }
    const events = store.events[groupId] || [];
    const idx = events.findIndex(event => event.id === eventId);
    if (idx < 0) {
      return { ok: false, error: { message: "Event not found." } };
    }
    const times = buildEventTimes({
      manualDate,
      manualTime,
      timezone,
      durationMinutes
    });
    const imageId = eventData.imageId || null;
    const imageUrl = imageId && getGalleryFile(imageId) ? getGalleryFile(imageId).previewUrl : null;
    events[idx] = {
      ...events[idx],
      title: eventData.title || events[idx].title,
      description: eventData.description || events[idx].description,
      category: eventData.category || events[idx].category,
      accessType: eventData.accessType || events[idx].accessType,
      languages: Array.isArray(eventData.languages) ? eventData.languages : events[idx].languages,
      platforms: Array.isArray(eventData.platforms) ? eventData.platforms : events[idx].platforms,
      tags: Array.isArray(eventData.tags) ? eventData.tags : events[idx].tags,
      roleIds: Array.isArray(eventData.roleIds) ? eventData.roleIds : events[idx].roleIds,
      imageId,
      imageUrl,
      startsAtUtc: times.startsAtUtc,
      endsAtUtc: times.endsAtUtc,
      durationMinutes: Number(durationMinutes) || events[idx].durationMinutes,
      timezone: timezone || events[idx].timezone
    };
    return { ok: true };
  },
  deleteEvent: async payload => {
    const { groupId, eventId } = payload || {};
    if (!groupId || !eventId) {
      return { ok: false, error: { message: "Missing event data." } };
    }
    const events = store.events[groupId] || [];
    const idx = events.findIndex(event => event.id === eventId);
    if (idx < 0) {
      return { ok: false, error: { message: "Event not found." } };
    }
    events.splice(idx, 1);
    return { ok: true };
  },
  getGalleryFiles: async payload => {
    const limit = Math.max(1, Math.min(100, Number(payload?.limit) || 40));
    const offset = Math.max(0, Number(payload?.offset) || 0);
    return deepClone(store.gallery.slice(offset, offset + limit));
  },
  uploadGalleryImage: async () => {
    const outcomes = [
      { ok: false, error: { code: "FILE_TOO_LARGE" } },
      { ok: false, error: { code: "FILE_TYPE" } },
      { ok: false, error: { code: "DIMENSIONS_TOO_SMALL" } },
      { ok: false, error: { code: "DIMENSIONS_TOO_LARGE" } },
      { ok: false, error: { code: "GALLERY_LIMIT" } },
      { ok: false, cancelled: true },
      { ok: true }
    ];
    const outcome = outcomes[store.galleryUploadIndex % outcomes.length];
    store.galleryUploadIndex += 1;
    if (!outcome.ok) {
      return outcome;
    }
    const id = nextUploadId();
    const file = {
      id,
      name: `Demo Upload ${store.counters.upload}`,
      extension: ".png",
      mimeType: "image/png",
      tags: ["gallery"],
      previewUrl: DEMO_IMAGE_URL,
      createdAt: DateTime.utc().toISO()
    };
    store.gallery.push(file);
    store.galleryMap[id] = file;
    return { ok: true, data: { id } };
  },
  getCachedImage: async imageId => {
    const file = getGalleryFile(imageId);
    return file ? file.previewUrl : null;
  },
  getCacheStatus: async imageIds => {
    const status = {};
    (imageIds || []).forEach(id => {
      status[id] = Boolean(getGalleryFile(id));
    });
    return status;
  },
  cleanGalleryCache: async () => 0,
  triggerBackgroundCache: async () => {},
  getAppInfo: async () => ({
    version: `${pkg.version}-DEMO`,
    dataDir: "Demo (temporary data)"
  }),
  checkForUpdate: async () => ({
    updateAvailable: Boolean(store.updateState.available),
    updateDownloaded: Boolean(store.updateState.downloaded),
    updateDownloading: Boolean(store.updateState.downloading),
    updateProgress: Number(store.updateState.progress) || 0,
    repoUrl: "https://github.com/Cynacedia/VRC-Event-Creator"
  }),
  downloadUpdate: async () => {
    if (store.updateState.downloading || store.updateState.downloaded) {
      return;
    }
    store.updateState.available = true;
    store.updateState.downloading = true;
    store.updateState.downloaded = false;
    store.updateState.progress = 0;
    store.updateState.version = pkg.version;
    scheduleUpdateProgress();
  },
  installUpdate: async () => {
    await ipcRenderer.invoke("demo:reload");
  },
  onUpdateReady: callback => {
    if (typeof callback === "function") {
      updateReadyListeners.push(callback);
    }
  },
  onUpdateProgress: callback => {
    if (typeof callback === "function") {
      updateProgressListeners.push(callback);
    }
  },
  getSettings: async () => deepClone(store.settings),
  updateSettings: async payload => {
    store.settings = { ...store.settings, ...payload };
    return deepClone(store.settings);
  },
  getThemeStore: async () => deepClone(store.themeStore),
  saveThemeStore: async payload => {
    store.themeStore = { ...payload };
    return deepClone(store.themeStore);
  },
  getThemePresets: async () => ({ presets: deepClone(store.themePresets) }),
  saveThemePreset: async payload => {
    const name = String(payload?.name || "Demo Theme").trim() || "Demo Theme";
    let key = payload?.key;
    if (!key) {
      key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!key) {
        key = "demo-theme";
      }
      let suffix = 1;
      let candidate = key;
      while (store.themePresets.some(preset => preset.key === candidate)) {
        suffix += 1;
        candidate = `${key}-${suffix}`;
      }
      key = candidate;
    }
    const existing = store.themePresets.findIndex(preset => preset.key === key);
    const entry = { key, name, colors: payload?.colors || {} };
    if (existing >= 0) {
      store.themePresets[existing] = entry;
    } else {
      store.themePresets.push(entry);
    }
    return { presets: deepClone(store.themePresets), selectedKey: key };
  },
  deleteThemePreset: async key => {
    store.themePresets = store.themePresets.filter(preset => preset.key !== key);
    return { presets: deepClone(store.themePresets) };
  },
  importThemePreset: async () => {
    const key = `demo-import-${Date.now()}`;
    store.themePresets.push({
      key,
      name: "Demo Imported",
      colors: {
        accent: "#f97316",
        bg: "#0f172a",
        panel: "#111827"
      }
    });
    return { ok: true, presets: deepClone(store.themePresets), selectedKey: key };
  },
  exportThemePreset: async () => ({ ok: true }),
  quitApp: async () => {
    await ipcRenderer.invoke("window:close");
  },
  openExternal: async url => {
    if (url) {
      await shell.openExternal(url);
    }
  },
  openDataDir: async () => {
    await shell.openPath(os.tmpdir());
  },
  selectDataDir: async () => null,
  getPendingEvents: async payload => {
    const { groupId, limit } = payload || {};
    const groupEvents = getPendingEventsForGroup(groupId);
    const list = typeof limit === "number" ? groupEvents.slice(0, limit) : groupEvents;
    const counts = updatePendingCounts(groupEvents);
    return { events: deepClone(list), missedCount: counts.missedCount, queuedCount: counts.queuedCount };
  },
  pendingAction: async payload => {
    const { pendingEventId, action, overrides } = payload || {};
    if (!pendingEventId || !action) {
      return { ok: false, error: { message: "Missing pending event data." } };
    }
    const groupId = Object.keys(store.pendingEvents).find(key =>
      store.pendingEvents[key].some(event => event.id === pendingEventId)
    );
    if (!groupId) {
      return { ok: false, error: { message: "Pending event not found." } };
    }
    const list = store.pendingEvents[groupId];
    const index = list.findIndex(event => event.id === pendingEventId);
    if (index < 0) {
      return { ok: false, error: { message: "Pending event not found." } };
    }
    const pendingEvent = list[index];
    if (action === "postNow") {
      const details = pendingEvent.resolvedDetails || {};
      const startsAtUtc = pendingEvent.eventStartsAt;
      const durationMinutes = Number(details.durationMinutes) || 120;
      const endsAtUtc = DateTime.fromISO(startsAtUtc).plus({ minutes: durationMinutes }).toISO();
      const event = normalizeEventData(groupId, details, startsAtUtc, endsAtUtc);
      if (!store.events[groupId]) {
        store.events[groupId] = [];
      }
      store.events[groupId].push(event);
      list.splice(index, 1);
      emit(automationCreatedListeners, { pendingEvent, eventId: event.id });
      return { ok: true };
    }
    if (action === "cancel") {
      list.splice(index, 1);
      return { ok: true };
    }
    if (action === "edit") {
      pendingEvent.resolvedDetails = {
        ...pendingEvent.resolvedDetails,
        ...overrides
      };
      if (overrides?.eventStartsAt) {
        pendingEvent.eventStartsAt = overrides.eventStartsAt;
      }
      return { ok: true };
    }
    return { ok: false, error: { message: "Unknown action." } };
  },
  getPendingSettings: async () => deepClone(store.pendingSettings),
  updatePendingSettings: async payload => {
    const { displayLimit } = payload || {};
    if (typeof displayLimit === "number" && displayLimit >= 1 && displayLimit <= 100) {
      store.pendingSettings.displayLimit = displayLimit;
      return { ok: true };
    }
    return { ok: false, error: { message: "Invalid displayLimit" } };
  },
  getAutomationStatus: async () => ({ initialized: true, profileStatus: null }),
  resolveAutomationEvent: async payload => {
    const { pendingEventId } = payload || {};
    if (!pendingEventId) {
      return { ok: false, error: { message: "Missing pendingEventId" } };
    }
    const groupId = Object.keys(store.pendingEvents).find(key =>
      store.pendingEvents[key].some(event => event.id === pendingEventId)
    );
    if (!groupId) {
      return { ok: false, error: { message: "Pending event not found." } };
    }
    const pendingEvent = store.pendingEvents[groupId].find(event => event.id === pendingEventId);
    return pendingEvent ? { ok: true, eventDetails: deepClone(pendingEvent.resolvedDetails) } : { ok: false };
  },
  onAutomationMissed: callback => {
    if (typeof callback === "function") {
      automationMissedListeners.push(callback);
    }
  },
  onAutomationCreated: callback => {
    if (typeof callback === "function") {
      automationCreatedListeners.push(callback);
    }
  }
});

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: callback => {
    ipcRenderer.on("window:maximized", (_, isMaximized) => callback(isMaximized));
  },
  onShowTrayPrompt: callback => {
    ipcRenderer.on("window:show-tray-prompt", () => callback());
  }
});

try {
  ipcRenderer.send("demo:preload-ready");
} catch {
  // Ignore IPC failures.
}
