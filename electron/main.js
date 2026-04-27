const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage, Tray, Menu, safeStorage } = require("electron");
const { autoUpdater } = require("electron-updater");

const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { generateDateOptionsFromPatterns, safeZone } = require("./core/date-utils");
const automationEngine = require("./core/automation-engine");
const discord = require("./core/discord");
const ics = require("./core/ics");
const webhook = require("./core/webhook");
const debugModule = require("./core/debug-log");
const galleryCacheModule = require("./core/gallery-cache");
const themeStoreModule = require("./core/theme-store");

const STABLE_USERDATA_NAME = "VRCEventCreator";
const STABLE_USERDATA_PATH = path.join(app.getPath("appData"), STABLE_USERDATA_NAME);
app.setPath("userData", STABLE_USERDATA_PATH);

// Disable GPU cache to suppress warnings
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

const APP_NAME = "VRChat Event Creator";
const IS_DEV = !app.isPackaged;

// Enforce single instance
const gotInstanceLock = app.requestSingleInstanceLock();
if (!gotInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow({ startHidden: false });
    }
  });
}

// Debug logging — delegated to core/debug-log.js
function initDebugLog() {
  debugModule.init(app.getPath("userData"), IS_DEV);
}

const finalizeDebugLog = debugModule.finalize;
const debugLog = debugModule.log;
const debugApiCall = debugModule.apiCall;
const normalizeVersion = debugModule.normalizeVersion;
const compareVersions = debugModule.compareVersions;

const debugApiResponse = debugModule.apiResponse;
const pkg = (() => {
  const pkgPath = path.join(__dirname, "..", "package.json");
  return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
})();
const APP_VERSION = pkg.version;
const UPDATE_REPO_OWNER = pkg.build?.publish?.owner || "Cynacedia";
const UPDATE_REPO_NAME = pkg.build?.publish?.repo || "VRC-Event-Creator";
const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Track update state
let updateDownloaded = false;
let updateDownloading = false;
let updateProgress = 0;
let updateVersion = null;

autoUpdater.on("download-progress", (progress) => {
  updateDownloading = true;
  updateProgress = Math.round(progress.percent || 0);
  if (mainWindow) {
    mainWindow.webContents.send("update-progress", { percent: updateProgress });
  }
});

autoUpdater.on("update-downloaded", (info) => {
  updateDownloaded = true;
  updateDownloading = false;
  updateProgress = 100;
  updateVersion = info?.version || null;
  if (mainWindow) {
    mainWindow.webContents.send("update-ready", { version: updateVersion });
  }
});

// Allow the app to fully quit during updates (avoid tray/minimize intercept)
autoUpdater.on("before-quit-for-update", () => {
  isQuitting = true;
  destroyTray();
});

// Force update checks in dev mode for testing
if (IS_DEV) {
  autoUpdater.forceDevUpdateConfig = true;
}

let mainWindow = null;
let appTray = null;
let isQuitting = false;
let currentUser = null;
let profiles = {};
let twoFactorRequest = null;
const AUTOSTART_ARG = "--autostart";

// These will be initialized after app is ready
let DATA_DIR;
let PROFILES_PATH;
let CACHE_PATH;
let SETTINGS_PATH;
let PENDING_EVENTS_PATH;
let AUTOMATION_STATE_PATH;
let GALLERY_CACHE_DIR;
let GALLERY_MANIFEST_PATH;
let settings;
let vrchat;
const groupPermissionCache = new Map();
const groupPrivacyCache = new Map();
const groupRolesCache = new Map();
const groupTagsCache = new Map();
const groupIconCache = new Map();
const FAILED_GET_CACHE_MS = 15 * 60 * 1000;
const GET_DEDUPE_WINDOW_MS = 10 * 1000;
const failedGetRequests = new Map();
const pendingGetRequests = new Map();

function resolveDataDir() {
  const override = process.env.VRC_EVENT_DATA_DIR;
  const baseDir = override || app.getPath("userData");
  fs.mkdirSync(baseDir, { recursive: true });
  return baseDir;
}

function initializePaths() {
  DATA_DIR = resolveDataDir();
  PROFILES_PATH = path.join(DATA_DIR, "profiles.json");
  CACHE_PATH = path.join(DATA_DIR, "cache.json");
  SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
  PENDING_EVENTS_PATH = path.join(DATA_DIR, "pending-events.json");
  AUTOMATION_STATE_PATH = path.join(DATA_DIR, "automation-state.json");
  GALLERY_CACHE_DIR = path.join(DATA_DIR, "gallery-cache");
  GALLERY_MANIFEST_PATH = path.join(GALLERY_CACHE_DIR, "manifest.json");
  galleryCacheModule.init({
    cacheDir: GALLERY_CACHE_DIR,
    manifestPath: GALLERY_MANIFEST_PATH,
    getVrchat: () => vrchat,
    debugLog: debugLog
  });
  settings = loadSettings();
  themeStoreModule.init({
    themesPath: path.join(DATA_DIR, "themes.json"),
    presetsDir: path.join(DATA_DIR, "themes"),
    seedPath: path.join(DATA_DIR, "themes", ".seeded"),
    bundledDir: path.join(__dirname, "themes"),
    getMainWindow: () => mainWindow,
    dialog
  });
  const rawThemeStore = themeStoreModule.loadThemeStoreRaw();
  themeStoreModule.setThemeStore(themeStoreModule.normalizeThemeStore(rawThemeStore));
  themeStoreModule.seedThemePresets();
  themeStoreModule.migrateThemeStorePresets(rawThemeStore);
  vrchat = createClient();
}

function normalizeCalendarReminders(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ value: 30, unit: "minutes" }];
  }
  const validUnits = ["minutes", "hours", "days"];
  const normalized = raw
    .filter(r => r && typeof r === "object" && typeof r.value === "number" && validUnits.includes(r.unit))
    .map(r => ({
      value: Math.max(1, Math.min(r.unit === "days" ? 7 : r.unit === "hours" ? 168 : 10080, Math.floor(r.value))),
      unit: r.unit
    }));
  return normalized.length ? normalized : [{ value: 30, unit: "minutes" }];
}

function normalizeSettings(raw) {
  // Only preserve the specific settings fields we define - ignore any other fields
  if (!raw || typeof raw !== "object") {
    return {
      warnConflicts: false,
      minimizeToTray: false,
      trayPromptShown: false,
      enableAdvanced: false,
      enableImportExport: false,
      autoUploadImages: false,
      startOnStartup: false,
      discordEnabled: false,
      calendarEnabled: false,
      calendarSaveDir: "",
      calendarReminders: [{ value: 30, unit: "minutes" }]
    };
  }
  return {
    warnConflicts: typeof raw.warnConflicts === "boolean" ? raw.warnConflicts : false,
    minimizeToTray: typeof raw.minimizeToTray === "boolean" ? raw.minimizeToTray : false,
    trayPromptShown: typeof raw.trayPromptShown === "boolean" ? raw.trayPromptShown : false,
    enableAdvanced: typeof raw.enableAdvanced === "boolean" ? raw.enableAdvanced : false,
    enableImportExport: typeof raw.enableImportExport === "boolean" ? raw.enableImportExport : false,
    autoUploadImages: typeof raw.autoUploadImages === "boolean" ? raw.autoUploadImages : false,
    startOnStartup: typeof raw.startOnStartup === "boolean" ? raw.startOnStartup : false,
    discordEnabled: typeof raw.discordEnabled === "boolean" ? raw.discordEnabled : false,
    calendarEnabled: typeof raw.calendarEnabled === "boolean" ? raw.calendarEnabled : false,
    calendarSaveDir: typeof raw.calendarSaveDir === "string" ? raw.calendarSaveDir : "",
    calendarReminders: normalizeCalendarReminders(raw.calendarReminders)
  };
}

function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
    return normalizeSettings(raw);
  } catch (err) {
    return normalizeSettings({});
  }
}

// Gallery cache — delegated to core/gallery-cache.js (initialized in initializePaths)

function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  // Manage tray based on minimizeToTray setting
  if (settings.minimizeToTray && !appTray) {
    createTray();
  } else if (!settings.minimizeToTray && appTray) {
    destroyTray();
  }

  // Manage startup on login setting (only for packaged builds)
  if (!IS_DEV) {
    app.setLoginItemSettings({
      openAtLogin: settings.startOnStartup,
      path: process.execPath,
      args: settings.startOnStartup ? [AUTOSTART_ARG] : []
    });
  }

  return settings;
}

// --- Discord token encryption helpers ---

function encryptToken(plainText) {
  if (!plainText) return "";
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(plainText);
    return "enc:" + encrypted.toString("base64");
  }
  return plainText;
}

function decryptToken(stored) {
  if (!stored) return "";
  if (stored.startsWith("enc:") && safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(stored.slice(4), "base64");
      return safeStorage.decryptString(buffer);
    } catch (err) {
      debugLog("discord", "Failed to decrypt token:", err.message);
      return "";
    }
  }
  // Plain text fallback (not yet encrypted, or encryption unavailable)
  return stored;
}

// --- Discord sync helper ---

function tryDiscordSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc) {
  if (!settings.discordEnabled) return;

  const groupData = profiles[groupId];
  if (!groupData) return;

  const botToken = decryptToken(groupData.discordBotToken);
  const guildId = groupData.discordGuildId;
  if (!botToken || !guildId) return;

  // Check event-level opt-out (from Create Event form)
  if (eventData?.discordSync === false) return;

  // Check profile-level opt-in (existing templates must explicitly enable)
  const profile = groupData.profiles?.[profileKey];
  if (profile && profile.discordSync !== true) return;

  // Resolve image base64 if available (non-blocking)
  const imagePromise = eventData.imageId
    ? getImageBase64ForDiscord(eventData.imageId).catch(() => null)
    : Promise.resolve(null);

  imagePromise.then(imageBase64 => {
    return discord.createDiscordScheduledEvent({
      botToken,
      guildId,
      name: eventData.title,
      description: eventData.description,
      startTime: startsAtUtc,
      endTime: endsAtUtc,
      imageBase64
    });
  }).then(result => {
    if (!result.ok) {
      debugLog("discord", "Failed to create Discord event:", result.error);
      if (mainWindow) {
        mainWindow.webContents.send("discord:syncFailed", {
          eventTitle: eventData.title,
          error: result.error
        });
      }
    } else {
      debugLog("discord", "Discord event created:", result.eventId);
      if (mainWindow) {
        mainWindow.webContents.send("discord:syncSuccess", {
          eventTitle: eventData.title
        });
      }
    }
  }).catch(err => {
    debugLog("discord", "Discord sync error:", err.message);
  });
}

async function getImageBase64ForDiscord(imageId) {
  if (!imageId) return null;
  // Try to read from gallery cache first
  const cachePath = path.join(GALLERY_CACHE_DIR, `${imageId}.png`);
  if (fs.existsSync(cachePath)) {
    const data = fs.readFileSync(cachePath);
    return `data:image/png;base64,${data.toString("base64")}`;
  }
  // Download from VRChat API
  const imageUrl = `https://api.vrchat.cloud/api/1/file/${imageId}/1`;
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    debugLog("discord", "Failed to fetch image for Discord:", err.message);
    return null;
  }
}

// --- Calendar / Webhook sync helper ---

async function getImageBufferForWebhook(fileId) {
  if (!fileId) return null;
  // Try gallery cache first (event images are often pre-cached)
  const cachePath = path.join(GALLERY_CACHE_DIR, `${fileId}.png`);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath);
  }
  // Download via authenticated VRChat SDK
  try {
    const fileRes = await vrchat.getFile({
      path: { fileId },
      throwOnError: false
    });
    const file = fileRes?.data;
    if (!file || !file.versions?.length) return null;
    const versionNum = file.versions[file.versions.length - 1]?.version ?? 1;
    const downloadRes = await vrchat.downloadFileVersion({
      path: { fileId, versionId: versionNum },
      throwOnError: false
    });
    const blob = downloadRes?.data;
    if (!blob) return null;
    return Buffer.from(await blob.arrayBuffer());
  } catch (err) {
    debugLog("webhook", "Failed to fetch image for webhook:", err.message);
    return null;
  }
}

function truncateText(str, maxLength) {
  if (!str || str.length <= maxLength) return str || "";
  return str.slice(0, maxLength - 3) + "...";
}

function tryCalendarSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc) {
  if (!settings.calendarEnabled) return;

  // Calendar creation must be enabled for this event
  if (eventData?.calendarCreate === false) return;

  const groupData = profiles[groupId];
  if (!groupData) return;

  // Check profile-level opt-in for calendar
  const profile = groupData.profiles?.[profileKey];
  if (profile && profile.calendarSync !== true) return;

  // Determine delivery method: webhook or auto-save
  const webhookUrl = decryptToken(groupData.webhookUrl);
  const useWebhook = webhookUrl && eventData?.discordSync !== false;

  // Resolve reminders: from eventData (per-event), fallback to profile, fallback to default
  let reminders = [];
  if (eventData?.calendarRemindersEnabled && Array.isArray(eventData.calendarReminders)) {
    reminders = eventData.calendarReminders;
  } else if (profile?.calendarRemindersEnabled && Array.isArray(profile.calendarReminders)) {
    reminders = profile.calendarReminders;
  }

  // Generate deterministic UID
  const startMs = new Date(startsAtUtc).getTime();
  const uid = `${groupId}-${startMs}@vrceventcreator`;

  // Generate ICS content
  const icsContent = ics.generateIcsString({
    title: eventData.title,
    description: eventData.description || "",
    startTime: startsAtUtc,
    endTime: endsAtUtc,
    location: "VRChat",
    uid,
    sequence: 0,
    reminders
  });

  // Build filename: "Event Name - [YYYY-MM-DD].ics"
  const safeTitle = (eventData.title || "event").replace(/[^a-zA-Z0-9_ -]/g, "").trim().slice(0, 50);
  const dateTag = new Date(startsAtUtc).toISOString().slice(0, 10);
  const filename = `${safeTitle} - ${dateTag}.ics`;

  if (useWebhook) {
    // --- Webhook delivery path ---
    const startUnix = Math.floor(new Date(startsAtUtc).getTime() / 1000);
    const endUnix = Math.floor(new Date(endsAtUtc).getTime() / 1000);

    const embed = {
      title: eventData.title,
      description: truncateText(eventData.description || "", 300),
      color: 0x1FC3AD,
      fields: [
        { name: "\uD83D\uDCC6", value: `<t:${startUnix}:D>`, inline: true },
        { name: "\uD83D\uDD50", value: `<t:${startUnix}:t> \u2014 <t:${endUnix}:t>`, inline: true },
        { name: "\uD83D\uDC65", value: groupData.groupName || "VRChat Group", inline: true }
      ]
    };

    // Resolve event image + group icon (non-blocking, parallel)
    const imagePromise = eventData.imageId
      ? getImageBufferForWebhook(eventData.imageId).catch(() => null)
      : Promise.resolve(null);
    const iconId = groupData.groupIconId || groupIconCache.get(groupId) || "";
    const iconPromise = iconId
      ? getImageBufferForWebhook(iconId).catch(() => null)
      : Promise.resolve(null);

    Promise.all([imagePromise, iconPromise]).then(([imageBuffer, iconBuffer]) => {
      if (imageBuffer) {
        embed.image = { url: "attachment://banner.png" };
      }
      if (iconBuffer) {
        embed.thumbnail = { url: "attachment://icon.png" };
      }
      return webhook.sendWebhookWithIcs({
        webhookUrl,
        icsContent,
        filename,
        embed,
        imageBuffer,
        imageFilename: imageBuffer ? "banner.png" : null,
        iconBuffer,
        iconFilename: iconBuffer ? "icon.png" : null,
        avatarUrl: `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/main/electron/app.png`
      });
    }).then(result => {
      if (!result.ok) {
        debugLog("calendar", "Failed to send webhook:", result.error);
        if (mainWindow) {
          mainWindow.webContents.send("webhook:syncFailed", {
            eventTitle: eventData.title,
            error: result.error
          });
        }
      } else {
        debugLog("calendar", "Webhook sent for:", eventData.title);
        if (mainWindow) {
          mainWindow.webContents.send("webhook:syncSuccess", {
            eventTitle: eventData.title
          });
        }
      }
    }).catch(err => {
      debugLog("calendar", "Webhook sync error:", err.message);
    });
  } else if (settings.calendarSaveDir) {
    // --- Auto-save path (no webhook configured) ---
    try {
      const savePath = path.join(settings.calendarSaveDir, filename);
      fs.writeFileSync(savePath, icsContent, "utf8");
      debugLog("calendar", "ICS auto-saved:", savePath);
      if (mainWindow) {
        mainWindow.webContents.send("calendar:autoSaved", {
          eventTitle: eventData.title,
          filePath: savePath
        });
      }
    } catch (err) {
      debugLog("calendar", "ICS auto-save failed:", err.message);
    }
  }
}

function maybeImportProfiles() {
  if (fs.existsSync(PROFILES_PATH)) {
    return;
  }
  const localPath = path.join(process.cwd(), "profiles.json");
  if (fs.existsSync(localPath)) {
    try {
      fs.copyFileSync(localPath, PROFILES_PATH);
    } catch (err) {
      // Ignore import errors.
    }
  }
}

function normalizeAutomation(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      enabled: false,
      timingMode: "before",
      daysOffset: 7,
      hoursOffset: 0,
      minutesOffset: 0,
      monthlyDay: 1,
      monthlyHour: 18,
      monthlyMinute: 0,
      repeatMode: "indefinite",
      repeatCount: 10
    };
  }
  return {
    enabled: typeof raw.enabled === "boolean" ? raw.enabled : false,
    timingMode: ["before", "after", "monthly"].includes(raw.timingMode) ? raw.timingMode : "before",
    daysOffset: typeof raw.daysOffset === "number" ? Math.max(0, Math.min(30, raw.daysOffset)) : 7,
    hoursOffset: typeof raw.hoursOffset === "number" ? Math.max(0, Math.min(23, raw.hoursOffset)) : 0,
    minutesOffset: typeof raw.minutesOffset === "number" ? Math.max(0, Math.min(59, raw.minutesOffset)) : 0,
    monthlyDay: typeof raw.monthlyDay === "number" ? Math.max(1, Math.min(31, raw.monthlyDay)) : 1,
    monthlyHour: typeof raw.monthlyHour === "number" ? Math.max(0, Math.min(23, raw.monthlyHour)) : 18,
    monthlyMinute: typeof raw.monthlyMinute === "number" ? Math.max(0, Math.min(59, raw.monthlyMinute)) : 0,
    repeatMode: ["indefinite", "count"].includes(raw.repeatMode) ? raw.repeatMode : "indefinite",
    repeatCount: typeof raw.repeatCount === "number" ? Math.max(1, Math.min(100, raw.repeatCount)) : 10
  };
}

function normalizeProfile(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  // Normalize automation field if present
  const automation = raw.automation ? normalizeAutomation(raw.automation) : normalizeAutomation({});
  return {
    ...raw,
    automation
  };
}

function normalizeProfiles(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const output = {};
  Object.entries(raw).forEach(([groupId, groupData]) => {
    if (!groupData || typeof groupData !== "object") {
      return;
    }
    // Normalize each profile within the group
    const normalizedProfiles = {};
    const profilesData = groupData.profiles || {};
    Object.entries(profilesData).forEach(([profileKey, profileData]) => {
      const normalized = normalizeProfile(profileData);
      if (normalized) {
        normalizedProfiles[profileKey] = normalized;
      }
    });
    output[groupId] = {
      groupName: groupData.groupName || "Unknown Group",
      groupIconId: typeof groupData.groupIconId === "string" ? groupData.groupIconId : "",
      discordBotToken: typeof groupData.discordBotToken === "string" ? groupData.discordBotToken : "",
      discordGuildId: typeof groupData.discordGuildId === "string" ? groupData.discordGuildId : "",
      webhookUrl: typeof groupData.webhookUrl === "string" ? groupData.webhookUrl : "",
      profiles: normalizedProfiles
    };
  });
  return output;
}

function loadProfiles() {
  try {
    const raw = JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
    return normalizeProfiles(raw);
  } catch (err) {
    return {};
  }
}

function saveProfiles(nextProfiles) {
  profiles = normalizeProfiles(nextProfiles);
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2));
}

function createClient() {
  return new VRChat({
    application: {
      name: "VRCEventHelper",
      version: "0.2.0",
      contact: UPDATE_REPO_URL
    },
    keyv: new KeyvFile({ filename: CACHE_PATH })
  });
}

function resetClient() {
  vrchat = createClient();
  currentUser = null;
  groupPermissionCache.clear();
  groupPrivacyCache.clear();
  groupRolesCache.clear();
  groupTagsCache.clear();
  failedGetRequests.clear();
  pendingGetRequests.clear();
}

async function clearSession() {
  try {
    fs.unlinkSync(CACHE_PATH);
  } catch (err) {
    // Ignore missing cache.
  }
  resetClient();
}

async function getCurrentUser() {
  debugApiCall("getCurrentUser", {});
  try {
    const res = await requestGet(
      "getCurrentUser",
      null,
      () => vrchat.getCurrentUser(),
      { cacheFailures: false }
    );
    debugApiResponse("getCurrentUser", res);
    if (typeof res.data === "string" || res.data?.error) {
      debugLog("getCurrentUser", "Invalid response data type or error in data");
      return null;
    }
    currentUser = res.data;
    return currentUser;
  } catch (err) {
    debugApiResponse("getCurrentUser", null, err);
    return null;
  }
}

async function ensureUser() {
  const user = currentUser || await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }
  return user;
}

function requestTwoFactorCode() {
  if (!twoFactorRequest) {
    twoFactorRequest = {};
    twoFactorRequest.promise = new Promise((resolve, reject) => {
      twoFactorRequest.resolve = resolve;
      twoFactorRequest.reject = reject;
    });
    if (mainWindow) {
      mainWindow.webContents.send("auth:twofactor");
    }
  }
  return twoFactorRequest.promise;
}

async function login(credentials) {
  const { username, password } = credentials || {};
  if (!username || !password) {
    throw new Error("Missing username or password.");
  }
  debugApiCall("login", { username, password: "***REDACTED***" });
  try {
    const loginRes = await vrchat.login({
      username,
      password,
      twoFactorCode: async () => {
        debugLog("login", "Two-factor authentication requested");
        const code = await requestTwoFactorCode();
        twoFactorRequest = null;
        return code;
      },
      throwOnError: true
    });
    debugApiResponse("login", loginRes);
    currentUser = loginRes.data;
    return currentUser;
  } catch (err) {
    debugApiResponse("login", null, err);
    throw err;
  }
}

function createTray() {
  if (appTray) return; // Already created

  const iconPath = path.join(__dirname, "app.ico");
  appTray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  appTray.setToolTip(APP_NAME);
  appTray.setContextMenu(contextMenu);

  // Double-click tray icon to show window
  appTray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function destroyTray() {
  if (appTray) {
    appTray.destroy();
    appTray = null;
  }
}

function shouldStartHiddenAtLogin() {
  const loginSettings = app.getLoginItemSettings ? app.getLoginItemSettings() : {};
  const launchedAtLogin = Boolean(loginSettings?.wasOpenedAtLogin) || process.argv.includes(AUTOSTART_ARG);
  return launchedAtLogin && settings?.minimizeToTray;
}

function createWindow(options = {}) {
  const { startHidden = false } = options;
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: "#0f1416",
    autoHideMenuBar: true,
    frame: false,
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: IS_DEV
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (startHidden && settings?.minimizeToTray) {
    createTray();
  }

  if (IS_DEV) {
    mainWindow.webContents.on("console-message", (event) => {
      const { level, message, lineNumber, sourceId } = event;
      const levelLabel = typeof level === "number" ? level : "log";
      console.log(`[renderer:${levelLabel}] ${message} (${sourceId}:${lineNumber})`);
    });
  }

  mainWindow.webContents.on("render-process-gone", (_, details) => {
    console.log("[renderer] process gone:", details);
  });

  mainWindow.on("unresponsive", () => {
    console.log("[window] unresponsive");
  });

  if (IS_DEV) {
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (!input || input.type !== "keyDown") {
        return;
      }
      const key = String(input.key || "").toLowerCase();
      if (input.control && input.shift && (key === "i" || key === "f12")) {
        event.preventDefault();
        mainWindow.webContents.openDevTools({ mode: "detach" });
      }
    });
  }

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window:maximized", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window:maximized", false);
  });

  // Handle window close - show prompt or minimize to tray
  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return; // Allow quit
    }

    // If tray is enabled, hide to tray
    if (settings?.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
      if (!appTray) {
        createTray();
      }
      return;
    }

    // If prompt hasn't been shown yet, show it
    if (!settings?.trayPromptShown) {
      event.preventDefault();
      mainWindow.webContents.send("window:show-tray-prompt");
    }
    // Otherwise, allow normal close
  });
}


function buildEventTimes({ selectedDateIso, manualDate, manualTime, timezone, durationMinutes }) {
  let start;
  if (selectedDateIso) {
    start = DateTime.fromISO(selectedDateIso, { setZone: true });
  } else {
    if (!manualDate || !manualTime) {
      throw new Error("Manual date and time required.");
    }
    const zone = safeZone(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    start = DateTime.fromISO(`${manualDate}T${manualTime}`, { zone });
  }
  if (!start.isValid) {
    throw new Error("Invalid date or time.");
  }
  const minutes = Number(durationMinutes) || 0;
  const end = start.plus({ minutes });
  return {
    startLocal: start,
    endLocal: end,
    startsAtUtc: start.setZone("UTC").toISO(),
    endsAtUtc: end.setZone("UTC").toISO()
  };
}

// Track recently created events locally (VRChat API has ~10-15s delay)
const recentlyCreatedEvents = new Map(); // key: "groupId::startsAtUtc", value: { title, createdAt }
const RECENT_EVENT_TTL = 60 * 60 * 1000; // 1 hour TTL

function trackCreatedEvent(groupId, startsAtUtc, title) {
  const key = `${groupId}::${startsAtUtc}`;
  recentlyCreatedEvents.set(key, { title, createdAt: Date.now() });
  debugLog("trackCreatedEvent", `Tracked event: ${key} - ${title}`);
  // Clean up old entries
  const now = Date.now();
  for (const [k, v] of recentlyCreatedEvents) {
    if (now - v.createdAt > RECENT_EVENT_TTL) {
      recentlyCreatedEvents.delete(k);
    }
  }
}

function findLocalConflict(groupId, startsAtUtc) {
  debugLog("findLocalConflict", `Checking for local conflict: ${groupId} at ${startsAtUtc}, tracked events: ${recentlyCreatedEvents.size}`);
  const targetTime = DateTime.fromISO(startsAtUtc);
  for (const [key, value] of recentlyCreatedEvents) {
    if (!key.startsWith(groupId + "::")) continue;
    const eventTimeStr = key.split("::")[1];
    const eventTime = DateTime.fromISO(eventTimeStr);
    if (eventTime && eventTime.isValid) {
      const diffMinutes = Math.abs(eventTime.diff(targetTime, "minutes").minutes);
      debugLog("findLocalConflict", `Comparing: target=${startsAtUtc} vs stored=${eventTimeStr}, diff=${diffMinutes} minutes`);
      if (diffMinutes < 1) {
        debugLog("findLocalConflict", `Found local conflict: ${value.title}`);
        return { title: value.title, startsAt: eventTimeStr, isLocal: true };
      }
    }
  }
  debugLog("findLocalConflict", "No local conflict found");
  return null;
}

async function findConflictingEvent(groupId, startsAtUtc) {
  // First check local tracking (handles VRChat API delay)
  const localConflict = findLocalConflict(groupId, startsAtUtc);
  if (localConflict) {
    return localConflict;
  }

  try {
    debugApiCall("getGroupCalendarEvents (findConflict)", { groupId, n: 100 });
    const currentEvents = await requestGet(
      "getGroupCalendarEvents",
      { path: { groupId }, query: { n: 100 } },
      () => vrchat.getGroupCalendarEvents({
        path: { groupId },
        query: { n: 100 }
      })
    );
    debugApiResponse("getGroupCalendarEvents (findConflict)", currentEvents);

    const results = getCalendarEventList(currentEvents.data);
    const targetTime = DateTime.fromISO(startsAtUtc);

    // Find event at same start time
    for (const event of results) {
      const eventStart = parseEventDateValue(getEventStartValue(event));
      if (eventStart && eventStart.isValid) {
        const diffMinutes = Math.abs(eventStart.diff(targetTime, "minutes").minutes);
        if (diffMinutes < 1) {
          return {
            id: getEventId(event),
            title: getEventField(event, "title") || "Untitled Event",
            startsAt: eventStart.toISO()
          };
        }
      }
    }

    return null;
  } catch (err) {
    debugLog("findConflictingEvent", "Error checking for conflicts:", err.message);
    return null;
  }
}

async function getUpcomingEventCount(groupId) {
  debugApiCall("getGroupCalendarEvents (countUpcoming)", { groupId, n: 100 });
  const currentEvents = await requestGet(
    "getGroupCalendarEvents",
    { path: { groupId }, query: { n: 100 } },
    () => vrchat.getGroupCalendarEvents({
      path: { groupId },
      query: { n: 100 }
    })
  );
  debugApiResponse("getGroupCalendarEvents (countUpcoming)", currentEvents);
  const results = getCalendarEventList(currentEvents.data);
  const now = DateTime.utc();
  let upcomingCount = 0;
  results.forEach(event => {
    const startValue = getEventStartValue(event);
    const endValue = getEventEndValue(event);
    const startsAt = parseEventDateValue(startValue);
    const endsAt = parseEventDateValue(endValue);
    if (endsAt && endsAt.isValid) {
      if (endsAt.toMillis() >= now.toMillis()) {
        upcomingCount += 1;
      }
      return;
    }
    if (startsAt && startsAt.isValid && startsAt.toMillis() >= now.toMillis()) {
      upcomingCount += 1;
    }
  });
  return upcomingCount;
}

function mapGroupCalendarEvents(results, groupId, options = {}) {
  const { upcomingOnly = true, includeNonEditable = false } = options;
  const now = DateTime.utc();
  return results
    .filter(event => {
      if (!getEventId(event)) {
        return false;
      }
      const editableFlag = getEventField(event, "canEdit")
        ?? getEventField(event, "isEditable")
        ?? getEventField(event, "editable");
      if (!includeNonEditable && editableFlag === false) {
        return false;
      }
      if (upcomingOnly) {
        return isUpcomingEvent(event, now);
      }
      return true;
    })
    .map(event => {
      const startValue = getEventStartValue(event);
      const endValue = getEventEndValue(event);
      const createdValue = getEventCreatedValue(event);
      const createdByValue = getEventCreatedByValue(event);
      const startsAt = parseEventDateValue(startValue);
      const endsAt = parseEventDateValue(endValue);
      const createdAt = parseEventDateValue(createdValue);
      const startsAtUtc = startsAt?.isValid ? startsAt.toUTC().toISO() : null;
      const endsAtUtc = endsAt?.isValid ? endsAt.toUTC().toISO() : null;
      const createdAtUtc = createdAt?.isValid ? createdAt.toUTC().toISO() : null;
      let durationMinutes = null;
      if (startsAt?.isValid && endsAt?.isValid) {
        durationMinutes = Math.max(1, Math.round(endsAt.diff(startsAt, "minutes").minutes));
      }
      const languages = getEventField(event, "languages");
        const platforms = getEventField(event, "platforms");
        const tags = getEventField(event, "tags");
        const roleIds = getEventField(event, "roleIds");
        const featured = getEventField(event, "featured");
        return {
          id: getEventId(event),
          groupId,
          title: getEventField(event, "title") || "",
          description: getEventField(event, "description") || "",
          category: getEventField(event, "category") || "hangout",
          accessType: getEventField(event, "accessType") || "public",
          languages: Array.isArray(languages) ? languages : [],
          platforms: Array.isArray(platforms) ? platforms : [],
          tags: Array.isArray(tags) ? tags : [],
          roleIds: Array.isArray(roleIds) ? roleIds : [],
          imageId: getEventField(event, "imageId") || null,
          imageUrl: getEventImageUrl(event),
          startsAtUtc,
          endsAtUtc,
          createdAtUtc,
          createdById: typeof createdByValue === "string" ? createdByValue : null,
          durationMinutes,
          timezone: getEventField(event, "timezone") || null,
          featured: Boolean(featured)
        };
      })
    .sort((a, b) => {
      const aTime = Date.parse(a.startsAtUtc || a.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      const bTime = Date.parse(b.startsAtUtc || b.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
}

function getCalendarEventList(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.events)) {
    return data.events;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.data?.results)) {
    return data.data.results;
  }
  if (Array.isArray(data?.data?.events)) {
    return data.data.events;
  }
  return [];
}

function getEventStartValue(event) {
  return event?.startsAt
    || event?.startTime
    || event?.start
    || event?.starts_at
    || event?.event?.startsAt
    || event?.event?.startTime
    || event?.event?.start
    || event?.event?.starts_at
    || null;
}

function getEventEndValue(event) {
  return event?.endsAt
    || event?.endTime
    || event?.end
    || event?.ends_at
    || event?.event?.endsAt
    || event?.event?.endTime
    || event?.event?.end
    || event?.event?.ends_at
    || null;
}

function getEventId(event) {
  return event?.id
    || event?.calendarId
    || event?.eventId
    || event?.event?.id
    || event?.event?.calendarId
    || event?.event?.eventId
    || null;
}

function getEventField(event, key) {
  if (!event || !key) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(event, key)) {
    return event[key];
  }
  if (event?.event && Object.prototype.hasOwnProperty.call(event.event, key)) {
    return event.event[key];
  }
  return null;
}

function getEventImageUrl(event) {
  const direct = getEventField(event, "imageUrl")
    || getEventField(event, "imageURL")
    || getEventField(event, "image");
  if (direct && typeof direct === "string") {
    return direct;
  }
  if (direct && typeof direct === "object") {
    return direct.url || direct.file?.url || null;
  }
  const image = getEventField(event, "image");
  if (image && typeof image === "object") {
    return image.url || image.file?.url || null;
  }
  return null;
}

function isUpcomingEvent(event, now) {
  const current = now || DateTime.utc();
  const startValue = getEventStartValue(event);
  const endValue = getEventEndValue(event);
  const startsAt = parseEventDateValue(startValue);
  const endsAt = parseEventDateValue(endValue);
  if (endsAt && endsAt.isValid) {
    return endsAt.toMillis() >= current.toMillis();
  }
  if (startsAt && startsAt.isValid) {
    return startsAt.toMillis() >= current.toMillis();
  }
  return false;
}

function getLatestFileVersion(file) {
  if (!file?.versions || !Array.isArray(file.versions) || !file.versions.length) {
    return null;
  }
  return file.versions.reduce((latest, entry) => {
    if (!latest) {
      return entry;
    }
    return (entry.version || 0) > (latest.version || 0) ? entry : latest;
  }, null);
}

function normalizeFileDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return null;
}

function parseEventDateValue(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return DateTime.fromJSDate(value);
  }
  if (typeof value === "number") {
    const ms = value > 1000000000000 ? value : value * 1000;
    return DateTime.fromMillis(ms);
  }
  if (typeof value === "string") {
    const iso = DateTime.fromISO(value);
    if (iso.isValid) {
      return iso;
    }
    const fallback = DateTime.fromRFC2822(value);
    return fallback.isValid ? fallback : null;
  }
  return null;
}

function getEventCreatedValue(event) {
  return event?.createdAt
    || event?.created_at
    || event?.event?.createdAt
    || event?.event?.created_at
    || null;
}

function getEventCreatedByValue(event) {
  return event?.createdById
    || event?.createdBy
    || event?.creatorId
    || event?.userId
    || event?.event?.createdById
    || event?.event?.createdBy
    || event?.event?.creatorId
    || event?.event?.userId
    || null;
}

function getRequestStatus(err) {
  return err?.response?.status || err?.status || null;
}

function buildGetCacheKey(name, options) {
  const payload = {
    path: options?.path || null,
    query: options?.query || null
  };
  return `${name}:${JSON.stringify(payload)}`;
}

function getCachedGetFailure(key) {
  const entry = failedGetRequests.get(key);
  if (!entry) {
    return null;
  }
  const age = Date.now() - entry.timestamp;
  if (age > FAILED_GET_CACHE_MS) {
    failedGetRequests.delete(key);
    return null;
  }
  return entry;
}

function recordFailedGet(key, status) {
  failedGetRequests.set(key, { status, timestamp: Date.now() });
}

async function requestGet(name, options, requestFn, config = {}) {
  const cacheFailures = config.cacheFailures !== false;
  const key = buildGetCacheKey(name, options);
  if (cacheFailures) {
    const cached = getCachedGetFailure(key);
    if (cached) {
      const error = new Error("Request blocked due to recent 403/404 response.");
      error.status = cached.status;
      error.code = "CACHED_GET";
      throw error;
    }
  }
  const now = Date.now();
  const pending = pendingGetRequests.get(key);
  if (pending && now - pending.startedAt < GET_DEDUPE_WINDOW_MS) {
    return pending.promise;
  }
  const promise = (async () => {
    try {
      return await requestFn();
    } catch (err) {
      const status = getRequestStatus(err);
      if (cacheFailures && (status === 403 || status === 404)) {
        recordFailedGet(key, status);
      }
      throw err;
    }
  })();
  pendingGetRequests.set(key, { promise, startedAt: now });
  setTimeout(() => {
    const entry = pendingGetRequests.get(key);
    if (entry && entry.startedAt === now) {
      pendingGetRequests.delete(key);
    }
  }, GET_DEDUPE_WINDOW_MS);
  return promise;
}

async function ensureCalendarPermission(groupId) {
  let permissions = groupPermissionCache.get(groupId);
  if (!permissions) {
    try {
      debugApiCall("getGroup (ensureCalendarPermission)", { groupId });
      const res = await requestGet(
        "getGroup",
        { path: { groupId } },
        () => vrchat.getGroup({ path: { groupId } })
      );
      debugApiResponse("getGroup (ensureCalendarPermission)", res);
      permissions = res.data?.myMember?.permissions || [];
    } catch (err) {
      debugApiResponse("getGroup (ensureCalendarPermission)", null, err);
      permissions = [];
    }
    groupPermissionCache.set(groupId, permissions);
  }
  const allowed =
    permissions.includes("*") || permissions.includes("group-calendar-manage");
  debugLog("ensureCalendarPermission", { groupId, permissions, allowed });
  if (!allowed) {
    throw new Error("You do not have permission to manage this group's calendar.");
  }
}

ipcMain.handle("app:info", () => ({
  name: APP_NAME,
  version: APP_VERSION,
  dataDir: DATA_DIR || "Not initialized"
}));

ipcMain.handle("app:checkUpdate", async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    const latestVersion = result?.updateInfo?.version || null;
    // Only report update if latest version is actually newer
    const updateAvailable = latestVersion && compareVersions(latestVersion, APP_VERSION) > 0;
    return {
      updateAvailable,
      updateDownloaded,
      updateDownloading,
      updateProgress,
      currentVersion: APP_VERSION,
      latestVersion,
      repoUrl: UPDATE_REPO_URL
    };
  } catch (err) {
    return {
      updateAvailable: false,
      updateDownloaded,
      updateDownloading,
      updateProgress,
      currentVersion: APP_VERSION,
      latestVersion: null,
      repoUrl: UPDATE_REPO_URL
    };
  }
});

ipcMain.handle("app:downloadUpdate", async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("app:installUpdate", () => {
  isQuitting = true;
  destroyTray();
  autoUpdater.quitAndInstall(true, true);
});

ipcMain.handle("app:openExternal", (_, url) => {
  if (!url || typeof url !== "string") {
    return false;
  }
  shell.openExternal(url);
  return true;
});

ipcMain.handle("app:quit", () => {
  app.quit();
});

ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return true;
});

ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
  return true;
});

ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
  return true;
});

ipcMain.handle("app:openDataDir", () => {
  shell.openPath(DATA_DIR);
});

ipcMain.handle("app:selectDataDir", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Data Directory"
  });

  if (result.canceled || !result.filePaths.length) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  return selectedPath;
});

ipcMain.handle("window:isMaximized", () => {
  if (!mainWindow) {
    return false;
  }
  return mainWindow.isMaximized();
});

ipcMain.handle("settings:get", () => settings);

ipcMain.handle("settings:set", (_, payload) => {
  const next = payload && typeof payload === "object" ? payload : {};
  return saveSettings({ ...settings, ...next });
});

// --- Discord IPC handlers ---

ipcMain.handle("discord:testConnection", async (_, botToken) => {
  if (!botToken) return { ok: false, error: "No bot token provided." };
  return discord.testBotConnection(botToken);
});

ipcMain.handle("discord:updateGroupDiscord", (_, { groupId, discordBotToken, discordGuildId }) => {
  if (!groupId || !profiles[groupId]) return { ok: false, error: "Group not found." };
  if (typeof discordBotToken === "string") {
    profiles[groupId].discordBotToken = encryptToken(discordBotToken);
  }
  if (typeof discordGuildId === "string") {
    profiles[groupId].discordGuildId = discordGuildId;
  }
  saveProfiles(profiles);
  return { ok: true };
});

ipcMain.handle("discord:getGroupDiscord", (_, groupId) => {
  if (!groupId || !profiles[groupId]) return { botToken: "", guildId: "" };
  return {
    botToken: decryptToken(profiles[groupId].discordBotToken || ""),
    guildId: profiles[groupId].discordGuildId || ""
  };
});

// --- Calendar / Webhook IPC handlers ---

ipcMain.handle("webhook:test", async (_, webhookUrl) => {
  if (!webhookUrl) return { ok: false, error: "No webhook URL provided." };
  return webhook.testWebhook(webhookUrl);
});

ipcMain.handle("webhook:updateGroupWebhook", (_, { groupId, webhookUrl }) => {
  if (!groupId || !profiles[groupId]) return { ok: false, error: "Group not found." };
  if (typeof webhookUrl === "string") {
    profiles[groupId].webhookUrl = encryptToken(webhookUrl);
  }
  saveProfiles(profiles);
  return { ok: true };
});

ipcMain.handle("webhook:getGroupWebhook", (_, groupId) => {
  if (!groupId || !profiles[groupId]) return { webhookUrl: "" };
  return {
    webhookUrl: decryptToken(profiles[groupId].webhookUrl || "")
  };
});

ipcMain.handle("calendar:generateAndSave", async (_, { eventData, startsAtUtc, endsAtUtc, groupId }) => {
  const startMs = new Date(startsAtUtc).getTime();
  const uid = `${groupId}-${startMs}@vrceventcreator`;
  const icsContent = ics.generateIcsString({
    title: eventData.title,
    description: eventData.description || "",
    startTime: startsAtUtc,
    endTime: endsAtUtc,
    location: "VRChat",
    uid,
    sequence: 0,
    reminders: (eventData.calendarRemindersEnabled && Array.isArray(eventData.calendarReminders)) ? eventData.calendarReminders : []
  });
  const safeTitle = (eventData.title || "event").replace(/[^a-zA-Z0-9_ -]/g, "").trim().slice(0, 50);
  const dateTag = new Date(startsAtUtc).toISOString().slice(0, 10);
  if (!mainWindow) return { ok: false, error: "No window." };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save Calendar File",
    defaultPath: `${safeTitle} - ${dateTag}.ics`,
    filters: [{ name: "iCalendar File", extensions: ["ics"] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, cancelled: true };
  fs.writeFileSync(result.filePath, icsContent, "utf8");
  return { ok: true };
});

ipcMain.handle("calendar:selectSaveDir", async () => {
  if (!mainWindow) return { ok: false };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Calendar Save Directory",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: settings.calendarSaveDir || app.getPath("documents")
  });
  if (result.canceled || !result.filePaths?.length) return { ok: false, cancelled: true };
  const dir = result.filePaths[0];
  settings.calendarSaveDir = dir;
  saveSettings(settings);
  return { ok: true, dir };
});

ipcMain.handle("theme:get", () => themeStoreModule.getThemeStore());

ipcMain.handle("theme:set", (_, payload) => {
  return themeStoreModule.saveThemeStore(payload);
});

ipcMain.handle("themePresets:get", () => {
  return { presets: themeStoreModule.loadThemePresets() };
});

ipcMain.handle("themePresets:save", (_, payload) => {
  return themeStoreModule.saveThemePreset(payload);
});

ipcMain.handle("themePresets:delete", (_, key) => {
  return themeStoreModule.deleteThemePreset(key);
});

ipcMain.handle("themePresets:import", async () => {
  return themeStoreModule.importThemePreset();
});

ipcMain.handle("themePresets:export", async (_, payload) => {
  return themeStoreModule.exportThemePreset(payload);
});

ipcMain.handle("events:importJson", async () => {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Import Event JSON",
    filters: [{ name: "Event JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths.length) {
    return { ok: false, cancelled: true };
  }
  const filePath = result.filePaths[0];
  let raw = null;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return { ok: false, error: { code: "FILE_INVALID", message: "Could not parse JSON file." } };
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: { code: "FILE_INVALID", message: "Invalid JSON structure." } };
  }
  return { ok: true, data: raw };
});

ipcMain.handle("events:exportJson", async (_, data) => {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Event JSON",
    defaultPath: `event-${Date.now()}.json`,
    filters: [{ name: "Event JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, cancelled: true };
  }
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: { code: "WRITE_FAILED", message: "Could not write JSON file." } };
  }
});

ipcMain.handle("profiles:importJson", async () => {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Import Profile JSON",
    filters: [{ name: "Profile JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths.length) {
    return { ok: false, cancelled: true };
  }
  const filePath = result.filePaths[0];
  let raw = null;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return { ok: false, error: { code: "FILE_INVALID", message: "Could not parse JSON file." } };
  }
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: { code: "FILE_INVALID", message: "Invalid JSON structure." } };
  }
  return { ok: true, data: raw };
});

ipcMain.handle("profiles:exportJson", async (_, data) => {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Profile JSON",
    defaultPath: `profile-${Date.now()}.json`,
    filters: [{ name: "Profile JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, cancelled: true };
  }
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: { code: "WRITE_FAILED", message: "Could not write JSON file." } };
  }
});

ipcMain.handle("auth:getCurrentUser", async () => {
  return getCurrentUser();
});

ipcMain.handle("auth:login", async (_, credentials) => {
  const user = await login(credentials);
  return { user };
});

ipcMain.handle("auth:logout", async () => {
  await clearSession();
  return true;
});

ipcMain.handle("auth:twofactor:submit", async (_, code) => {
  if (twoFactorRequest?.resolve) {
    twoFactorRequest.resolve(code);
    return true;
  }
  return false;
});

ipcMain.handle("groups:list", async () => {
  debugApiCall("getUserGroups", {});
  const user = await ensureUser();
  const groupsResponse = await requestGet(
    "getUserGroups",
    { path: { userId: user.id } },
    () => vrchat.getUserGroups({ path: { userId: user.id } })
  );
  debugApiResponse("getUserGroups", groupsResponse);
  const limitedGroups = groupsResponse.data || [];
  const enriched = [];
  for (const group of limitedGroups) {
    const groupId = group.groupId || group.id;
    if (groupId && group.iconId) groupIconCache.set(groupId, group.iconId);
    if (!groupId) {
      enriched.push({ ...group, canManageCalendar: false });
      continue;
    }
    let permissions = groupPermissionCache.get(groupId);
    let privacy = groupPrivacyCache.get(groupId);
    const hasPermissions = Array.isArray(permissions);
    const hasPrivacy = privacy !== undefined;
    if (!hasPermissions || !hasPrivacy) {
      try {
        debugApiCall("getGroup", { groupId });
        const groupRes = await requestGet(
          "getGroup",
          { path: { groupId } },
          () => vrchat.getGroup({ path: { groupId } })
        );
        debugApiResponse("getGroup", groupRes);
        permissions = groupRes.data?.myMember?.permissions || [];
        privacy = groupRes.data?.privacy;
        const tags = groupRes.data?.tags || [];
        groupTagsCache.set(groupId, tags);
      } catch (err) {
        debugApiResponse("getGroup", null, err);
        if (!hasPermissions) {
          permissions = [];
        }
      }
      groupPermissionCache.set(groupId, permissions);
      if (privacy !== undefined) {
        groupPrivacyCache.set(groupId, privacy);
      }
    }
    const canManageCalendar =
      permissions.includes("*") || permissions.includes("group-calendar-manage");
    enriched.push({ ...group, groupId, canManageCalendar, privacy: privacy ?? group.privacy });
  }
  if (automationEngine.isInitialized()) {
    const knownGroupIds = enriched
      .filter(group => group.canManageCalendar)
      .map(group => group.groupId)
      .filter(Boolean);
    const pruneResult = automationEngine.setKnownGroupIds(knownGroupIds);
    if (pruneResult.removedPending || pruneResult.removedDeleted) {
      debugLog(
        "Automation",
        `Pruned ${pruneResult.removedPending} pending + ${pruneResult.removedDeleted} deleted for unknown groups`
      );
    }
  }
  return enriched;
});

ipcMain.handle("groups:checkFeatureFlags", async (_, groupId) => {
  if (!groupId) {
    return { hasFeaturedEvents: false, hasGroupFair: false };
  }

  try {
    // Check cache first
    let tags = groupTagsCache.get(groupId);

    // If not cached, fetch group details
    if (!tags) {
      debugApiCall("getGroup (checkFeatureFlags)", { groupId });
      const groupRes = await requestGet(
        "getGroup",
        { path: { groupId } },
        () => vrchat.getGroup({ path: { groupId } })
      );
      debugApiResponse("getGroup (checkFeatureFlags)", groupRes);
      tags = groupRes.data?.tags || [];
      groupTagsCache.set(groupId, tags);
    }

    // Return boolean flags, NOT the actual tags
    return {
      hasFeaturedEvents: tags.includes("admin_featured_events_enabled"),
      hasGroupFair: tags.includes("admin_vrc_event_group_fair_enabled")
    };
  } catch (err) {
    debugApiResponse("getGroup (checkFeatureFlags)", null, err);
    // On error, return false for both (safe default)
    return { hasFeaturedEvents: false, hasGroupFair: false };
  }
});

ipcMain.handle("groups:roles", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId) {
    throw new Error("Missing group.");
  }
  await ensureUser();
  await ensureCalendarPermission(groupId);
  let roles = groupRolesCache.get(groupId);
  if (!roles) {
    debugApiCall("getGroupRoles", { groupId });
    const response = await requestGet(
      "getGroupRoles",
      { path: { groupId } },
      () => vrchat.getGroupRoles({ path: { groupId } })
    );
    debugApiResponse("getGroupRoles", response);
    roles = response.data || [];
    groupRolesCache.set(groupId, roles);
  }
  return roles;
});

ipcMain.handle("profiles:list", async () => {
  return profiles;
});

ipcMain.handle("profiles:create", async (_, payload) => {
  const { groupId, groupName, groupIconId, profileKey, data } = payload || {};
  if (!groupId || !profileKey || !data) {
    throw new Error("Invalid profile payload.");
  }
  const existing = profiles[groupId]?.profiles?.[profileKey];
  if (existing) {
    throw new Error("Profile already exists.");
  }
  if (!profiles[groupId]) {
    profiles[groupId] = { groupName: groupName || "Unknown Group", profiles: {} };
  }
  profiles[groupId].groupName = groupName || profiles[groupId].groupName;
  if (groupIconId) profiles[groupId].groupIconId = groupIconId;
  profiles[groupId].profiles[profileKey] = data;
  saveProfiles(profiles);
  return profiles;
});

ipcMain.handle("profiles:update", async (_, payload) => {
  const { groupId, groupName, groupIconId, profileKey, data } = payload || {};
  if (!groupId || !profileKey || !data) {
    throw new Error("Invalid profile payload.");
  }
  if (!profiles[groupId]) {
    profiles[groupId] = { groupName: groupName || "Unknown Group", profiles: {} };
  }
  profiles[groupId].groupName = groupName || profiles[groupId].groupName;
  if (groupIconId) profiles[groupId].groupIconId = groupIconId;
  profiles[groupId].profiles[profileKey] = data;
  saveProfiles(profiles);

  // Trigger automation recalculation for this profile
  if (automationEngine.isInitialized()) {
    try {
      await ensureUser();
      await ensureCalendarPermission(groupId);
      debugApiCall("getGroupCalendarEvents (reconcilePublished)", { groupId, n: 100 });
      const response = await requestGet(
        "getGroupCalendarEvents",
        { path: { groupId }, query: { n: 100 } },
        () => vrchat.getGroupCalendarEvents({
          path: { groupId },
          query: { n: 100 }
        })
      );
      debugApiResponse("getGroupCalendarEvents (reconcilePublished)", response);
      const results = getCalendarEventList(response.data);
      const mapped = mapGroupCalendarEvents(results, groupId, { upcomingOnly: true, includeNonEditable: false });
      if (mapped.length < 100) {
        automationEngine.reconcilePublishedEvents(groupId, mapped);
      }
    } catch (err) {
      debugApiResponse("getGroupCalendarEvents (reconcilePublished)", null, err);
    }
    automationEngine.updatePendingEventsForProfile(groupId, profileKey, data);
  }

  return profiles;
});

ipcMain.handle("profiles:delete", async (_, payload) => {
  const { groupId, profileKey } = payload || {};
  if (!groupId || !profileKey) {
    throw new Error("Invalid profile payload.");
  }
  if (profiles[groupId]?.profiles?.[profileKey]) {
    delete profiles[groupId].profiles[profileKey];
    saveProfiles(profiles);

    // Clean up pending events for deleted profile
    if (automationEngine.isInitialized()) {
      automationEngine.purgeProfilePendingEvents(groupId, profileKey);
    }
  }
  return profiles;
});

ipcMain.handle("dates:options", async (_, payload) => {
  const { patterns, monthsAhead, timezone } = payload || {};
  return generateDateOptionsFromPatterns(patterns || [], monthsAhead || 6, timezone || "UTC");
});

ipcMain.handle("events:prepare", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId) {
    throw new Error("Missing group.");
  }
  await ensureCalendarPermission(groupId);
  const times = buildEventTimes(payload);
  const conflictEvent = await findConflictingEvent(groupId, times.startsAtUtc);
  return {
    startsAtUtc: times.startsAtUtc,
    endsAtUtc: times.endsAtUtc,
    conflictEvent
  };
});

ipcMain.handle("events:create", async (_, payload) => {
  try {
    const { groupId, startsAtUtc, endsAtUtc, eventData, profileKey } = payload || {};
    if (!groupId || !startsAtUtc || !endsAtUtc || !eventData) {
      throw new Error("Missing event data.");
    }
    await ensureCalendarPermission(groupId);

    // Validate admin tags if using featured or group fair
    if (eventData.featured || eventData.tags?.includes("vrc_event_group_fair")) {
      debugApiCall("getGroup (validateFeatures)", { groupId });
      const groupRes = await requestGet(
        "getGroup",
        { path: { groupId } },
        () => vrchat.getGroup({ path: { groupId } })
      );
      debugApiResponse("getGroup (validateFeatures)", groupRes);

      const groupTags = groupRes.data?.tags || [];

      // Validate featured event permission
      if (eventData.featured && !groupTags.includes("admin_featured_events_enabled")) {
        const error = new Error("FEATURED_PERMISSION_REVOKED");
        error.code = "FEATURED_PERMISSION_REVOKED";
        throw error;
      }

      // Validate group fair permission
      if (eventData.tags?.includes("vrc_event_group_fair") &&
          !groupTags.includes("admin_vrc_event_group_fair_enabled")) {
        const error = new Error("GROUP_FAIR_PERMISSION_REVOKED");
        error.code = "GROUP_FAIR_PERMISSION_REVOKED";
        throw error;
      }
    }

    const requestBody = {
      title: eventData.title,
      description: eventData.description,
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      category: eventData.category,
      sendCreationNotification: eventData.sendCreationNotification,
      accessType: eventData.accessType,
      languages: eventData.languages || [],
      platforms: eventData.platforms || [],
      tags: eventData.tags || [],
      imageId: eventData.imageId || null,
      featured: Boolean(eventData.featured),
      isDraft: false,
      parentId: null,
      roleIds: Array.isArray(eventData.roleIds) ? eventData.roleIds : []
    };
    debugLog("createEvent", "Featured flag:", requestBody.featured);
    debugApiCall("createGroupCalendarEvent", { groupId, body: requestBody });
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugApiResponse("createGroupCalendarEvent", response);
    const eventId = getEventId(response.data);
    // Track locally created event for conflict detection (VRChat API has delay)
    trackCreatedEvent(groupId, startsAtUtc, eventData.title);
    if (automationEngine.isInitialized() && profileKey) {
      const profile = profiles?.[groupId]?.profiles?.[profileKey];
      if (profile?.automation?.enabled) {
        automationEngine.recordManualEvent(groupId, profileKey, startsAtUtc);
        automationEngine.updatePendingEventsForProfile(groupId, profileKey, profile);
      }
    }
    // Discord sync (fire-and-forget, never blocks VRC event creation)
    tryDiscordSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc);
    // Calendar webhook sync (fire-and-forget)
    tryCalendarSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc);
    return { ok: true, eventId };
  } catch (err) {
    debugApiResponse("createGroupCalendarEvent", null, err);
    debugLog("createEvent", "API Error details:", {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      data: err?.response?.data,
      message: err?.message
    });
    const status = err?.response?.status || null;
    return {
      ok: false,
      error: {
        status,
        code: status === 429 ? "UPCOMING_LIMIT" : null,
        message: err?.message || "Could not create event."
      }
    };
  }
});

ipcMain.handle("events:countUpcoming", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId) {
    throw new Error("Missing group.");
  }
  await ensureUser();
  const count = await getUpcomingEventCount(groupId);
  return { count, limit: 10 };
});

ipcMain.handle("events:listGroup", async (_, payload) => {
  const { groupId, upcomingOnly = true, includeNonEditable = false } = payload || {};
  if (!groupId) {
    throw new Error("Missing group.");
  }
  await ensureUser();
  await ensureCalendarPermission(groupId);
  debugApiCall("getGroupCalendarEvents (listGroup)", { groupId, n: 100, upcomingOnly });
  const response = await requestGet(
    "getGroupCalendarEvents",
    { path: { groupId }, query: { n: 100 } },
    () => vrchat.getGroupCalendarEvents({
      path: { groupId },
      query: { n: 100 }
    })
  );
  debugApiResponse("getGroupCalendarEvents (listGroup)", response);
  const results = getCalendarEventList(response.data);
  const mapped = mapGroupCalendarEvents(results, groupId, { upcomingOnly, includeNonEditable });
  if (automationEngine.isInitialized() && upcomingOnly && mapped.length < 100) {
    const reconcileResult = automationEngine.reconcilePublishedEvents(groupId, mapped);
    if (reconcileResult.removed || reconcileResult.updated || reconcileResult.reconciled) {
      debugLog(
        "Automation",
        `Reconciled events for ${groupId}: ${reconcileResult.updated} updated, ${reconcileResult.removed} removed, ${reconcileResult.reconciled || 0} duplicates caught`
      );
    }
  }
  return mapped;
});

ipcMain.handle("events:update", async (_, payload) => {
  try {
    const { groupId, eventId, eventData, timezone, durationMinutes, manualDate, manualTime } = payload || {};
    if (!groupId || !eventId || !eventData) {
      throw new Error("Missing event data.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);
    const times = buildEventTimes({
      manualDate,
      manualTime,
      timezone,
      durationMinutes
    });
    const requestBody = {
      title: eventData.title,
      description: eventData.description,
      startsAt: times.startsAtUtc,
      endsAt: times.endsAtUtc,
      category: eventData.category,
      sendCreationNotification: eventData.sendCreationNotification,
      accessType: eventData.accessType,
      languages: eventData.languages || [],
      platforms: eventData.platforms || [],
      tags: eventData.tags || [],
      imageId: eventData.imageId || null,
      featured: Boolean(eventData.featured),
      isDraft: false,
      parentId: null,
      ...(Array.isArray(eventData.roleIds) ? { roleIds: eventData.roleIds } : {})
    };
    debugLog("updateEvent", "Featured flag:", requestBody.featured);
    debugApiCall("updateGroupCalendarEvent", { groupId, eventId, body: requestBody });
    const response = await vrchat.updateGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId: eventId },
      body: requestBody
    });
    debugApiResponse("updateGroupCalendarEvent", response);
    return { ok: true };
  } catch (err) {
    debugApiResponse("updateGroupCalendarEvent", null, err);
    debugLog("updateEvent", "API Error details:", {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      data: err?.response?.data,
      message: err?.message
    });
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not update event."
      }
    };
  }
});

ipcMain.handle("events:delete", async (_, payload) => {
  try {
    const { groupId, eventId } = payload || {};
    if (!groupId || !eventId) {
      throw new Error("Missing event data.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);
    debugApiCall("deleteGroupCalendarEvent", { groupId, eventId });
    const response = await vrchat.deleteGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId: eventId }
    });
    debugApiResponse("deleteGroupCalendarEvent", response);
    return { ok: true };
  } catch (err) {
    debugApiResponse("deleteGroupCalendarEvent", null, err);
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not delete event."
      }
    };
  }
});

ipcMain.handle("files:listGallery", async (_, payload) => {
  await ensureUser();
  const limit = Math.max(1, Math.min(100, Number(payload?.limit) || 40));
  const offset = Math.max(0, Number(payload?.offset) || 0);
  debugApiCall("getFiles (listGallery)", { tag: "gallery", n: limit, offset });
  const res = await requestGet(
    "getFiles",
    { query: { tag: "gallery", n: limit, offset } },
    () => vrchat.getFiles({
      query: {
        tag: "gallery",
        n: limit,
        offset
      }
    })
  );
  debugApiResponse("getFiles (listGallery)", res);
  const files = Array.isArray(res.data) ? res.data : [];
  const mappedFiles = files.map(file => {
    const latest = getLatestFileVersion(file);
    return {
      id: file.id,
      name: file.name || file.id,
      extension: file.extension,
      mimeType: file.mimeType,
      tags: Array.isArray(file.tags) ? file.tags : [],
      previewUrl: latest?.file?.url || null,
      createdAt: normalizeFileDate(latest?.created_at || file.created_at || file.createdAt)
    };
  });

  // Cache invalidation: remove images no longer in gallery
  if (offset === 0) {
    const currentIds = mappedFiles.map(f => f.id);
    galleryCacheModule.removeDeletedFromGalleryCache(currentIds);
  }

  return mappedFiles;
});

ipcMain.handle("files:uploadGallery", async () => {
  try {
    await ensureUser();

    debugApiCall("getFiles (uploadGallery limitCheck)", { tag: "gallery", n: 64, offset: 0 });
    const limitCheck = await requestGet(
      "getFiles",
      { query: { tag: "gallery", n: 64, offset: 0 } },
      () => vrchat.getFiles({
        query: {
          tag: "gallery",
          n: 64,
          offset: 0
        }
      })
    );
    debugApiResponse("getFiles (uploadGallery limitCheck)", limitCheck);
    const existingFiles = Array.isArray(limitCheck.data) ? limitCheck.data : [];
    if (existingFiles.length >= 64) {
      debugLog("uploadGallery", "Gallery limit reached:", existingFiles.length);
      return { ok: false, error: { code: "GALLERY_LIMIT" } };
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      title: "Select Gallery Image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }]
    });

    if (result.canceled || !result.filePaths.length) {
      return { ok: false, cancelled: true };
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" : "";
    if (!mimeType) {
      return { ok: false, error: { code: "FILE_TYPE" } };
    }

    // Read file atomically using file descriptor to avoid race condition
    const fd = fs.openSync(filePath, "r");
    try {
      const stats = fs.fstatSync(fd);
      if (!stats.isFile()) {
        fs.closeSync(fd);
        return { ok: false, error: { code: "FILE_INVALID" } };
      }

      const maxBytes = 10 * 1024 * 1024;
      if (stats.size >= maxBytes) {
        fs.closeSync(fd);
        return { ok: false, error: { code: "FILE_TOO_LARGE" } };
      }

      const buffer = Buffer.alloc(stats.size);
      fs.readSync(fd, buffer, 0, stats.size, 0);
      fs.closeSync(fd);

      const image = nativeImage.createFromBuffer(buffer);
      if (image.isEmpty()) {
        return { ok: false, error: { code: "FILE_TYPE" } };
      }
      const { width, height } = image.getSize();
      if (width <= 64 || height <= 64) {
        return { ok: false, error: { code: "DIMENSIONS_TOO_SMALL" } };
      }
      if (width >= 2048 || height >= 2048) {
        return { ok: false, error: { code: "DIMENSIONS_TOO_LARGE" } };
      }

      const uploadFile = typeof File === "function"
        ? new File([buffer], fileName, { type: mimeType })
        : new Blob([buffer], { type: mimeType });
      debugApiCall("uploadGalleryImage", { fileName, mimeType, size: buffer.length, width, height });
      const res = await vrchat.uploadGalleryImage({
        body: { file: uploadFile },
        throwOnError: true
      });
      debugApiResponse("uploadGalleryImage", res);

      return { ok: true, data: res?.data || null };
    } catch (fdErr) {
      try { fs.closeSync(fd); } catch (e) { /* ignore */ }
      throw fdErr;
    }
  } catch (err) {
    debugApiResponse("uploadGalleryImage", null, err);
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not upload gallery image."
      }
    };
  }
});

ipcMain.handle("files:uploadGalleryBase64", async (_, payload) => {
  const { base64Data } = payload || {};
  if (!base64Data || typeof base64Data !== "string") {
    return { ok: false, error: { code: "INVALID_DATA", message: "No base64 data provided." } };
  }

  try {
    // Parse data URL format: data:image/png;base64,iVBOR...
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return { ok: false, error: { code: "INVALID_FORMAT", message: "Invalid base64 data URL format." } };
    }

    const mimeType = match[1];
    const base64Content = match[2];
    const buffer = Buffer.from(base64Content, "base64");

    // Validate file size (max 10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (buffer.length >= maxBytes) {
      return { ok: false, error: { code: "FILE_TOO_LARGE" } };
    }

    // Validate image
    const image = nativeImage.createFromBuffer(buffer);
    if (image.isEmpty()) {
      return { ok: false, error: { code: "FILE_TYPE", message: "Invalid image data." } };
    }
    const { width, height } = image.getSize();
    if (width <= 64 || height <= 64) {
      return { ok: false, error: { code: "DIMENSIONS_TOO_SMALL" } };
    }
    if (width >= 2048 || height >= 2048) {
      return { ok: false, error: { code: "DIMENSIONS_TOO_LARGE" } };
    }

    // Determine file extension
    const extMap = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
    const ext = extMap[mimeType] || "png";
    const fileName = `imported-${Date.now()}.${ext}`;

    const uploadFile = typeof File === "function"
      ? new File([buffer], fileName, { type: mimeType })
      : new Blob([buffer], { type: mimeType });

    debugApiCall("uploadGalleryImage (base64)", { fileName, mimeType, size: buffer.length, width, height });
    const res = await vrchat.uploadGalleryImage({
      body: { file: uploadFile },
      throwOnError: true
    });
    debugApiResponse("uploadGalleryImage (base64)", res);

    return { ok: true, data: res?.data || null };
  } catch (err) {
    debugApiResponse("uploadGalleryImage (base64)", null, err);
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not upload image."
      }
    };
  }
});

// ============================================
// Gallery Cache IPC Handlers
// ============================================

ipcMain.handle("gallery:getCachedImage", async (_, payload) => {
  const { imageId } = payload || {};
  if (!imageId) return null;
  return galleryCacheModule.getCachedImageAsDataUrl(imageId);
});

ipcMain.handle("gallery:getImageAsBase64", async (_, payload) => {
  const { imageId } = payload || {};
  if (!imageId) return null;

  // First check if already cached
  let dataUrl = galleryCacheModule.getCachedImageAsDataUrl(imageId);
  if (dataUrl) return dataUrl;

  // Not cached, try to download using authenticated SDK method
  try {
    // Get file info to determine version and mime type
    debugLog("gallery", `Fetching file info for ${imageId}`);
    const fileRes = await vrchat.getFile({
      path: { fileId: imageId },
      throwOnError: true
    });
    const file = fileRes?.data;
    if (!file) {
      debugLog("gallery", `No file data returned for ${imageId}`);
      return null;
    }

    // Get the latest version - use the version field from the last entry
    const lastVersion = file.versions?.[file.versions.length - 1];
    const versionNum = lastVersion?.version ?? 1;
    const mimeType = file.mimeType || "image/png";

    debugLog("gallery", `Downloading ${imageId} version ${versionNum} via SDK (versions array length: ${file.versions?.length})`);

    // Use SDK's downloadFileVersion which handles authentication
    const downloadRes = await vrchat.downloadFileVersion({
      path: { fileId: imageId, versionId: versionNum },
      throwOnError: true
    });

    const blob = downloadRes?.data;
    if (!blob) {
      debugLog("gallery", `No blob data returned for ${imageId}`);
      return null;
    }

    // Convert Blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    debugLog("gallery", `Downloaded ${imageId}: ${buffer.length} bytes`);

    // Validate image data by checking magic bytes
    const isValidImage =
      (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
      (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) || // JPEG
      (buffer.length >= 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50); // WebP

    if (!isValidImage) {
      debugLog("gallery", `Invalid image magic bytes for ${imageId}`);
      return null;
    }

    // Save to cache
    galleryCacheModule.ensureGalleryCacheDir();
    const ext = mimeType === "image/png" ? ".png" : ".jpg";
    const localFileName = `${imageId}${ext}`;
    const localPath = path.join(GALLERY_CACHE_DIR, localFileName);

    // Validate path is within cache directory
    const normalizedPath = path.normalize(localPath);
    const normalizedCacheDir = path.normalize(GALLERY_CACHE_DIR);
    if (!normalizedPath.startsWith(normalizedCacheDir)) {
      debugLog("gallery", `Invalid path detected for ${imageId}`);
      return null;
    }

    fs.writeFileSync(localPath, buffer);

    // Update manifest
    const manifest = galleryCacheModule.loadGalleryCacheManifest();
    manifest.images[imageId] = {
      localPath: localFileName,
      mimeType,
      cachedAt: new Date().toISOString()
    };
    galleryCacheModule.saveGalleryCacheManifest(manifest);

    debugLog("gallery", `Cached ${imageId} successfully`);
    return galleryCacheModule.getCachedImageAsDataUrl(imageId);
  } catch (err) {
    debugLog("gallery", `Failed to fetch image ${imageId}:`, err.message);
    return null;
  }
});

ipcMain.handle("gallery:checkImageExists", async (_, payload) => {
  const { imageId } = payload || {};
  if (!imageId) return false;

  try {
    // Try to get file info - if it succeeds, the image exists in user's gallery
    const fileRes = await vrchat.getFile({
      path: { fileId: imageId },
      throwOnError: false
    });
    return !!(fileRes?.data?.id);
  } catch (err) {
    debugLog("gallery", `Image ${imageId} does not exist or is not accessible:`, err.message);
    return false;
  }
});

ipcMain.handle("gallery:getCacheStatus", async (_, payload) => {
  const { imageIds } = payload || {};
  if (!Array.isArray(imageIds)) return {};
  const manifest = galleryCacheModule.loadGalleryCacheManifest();
  const status = {};
  for (const id of imageIds) {
    status[id] = !!manifest.images[id];
  }
  return status;
});

ipcMain.handle("gallery:cleanCache", async (_, payload) => {
  const { maxAgeDays } = payload || {};
  return galleryCacheModule.cleanGalleryCache(maxAgeDays || 30);
});

ipcMain.handle("gallery:triggerBackgroundCache", async (_, payload) => {
  const { images } = payload || {};
  if (!Array.isArray(images) || images.length === 0) return;

  const manifest = galleryCacheModule.loadGalleryCacheManifest();
  const toDownload = images.filter(img => !manifest.images[img.id] && img.previewUrl);

  if (toDownload.length === 0) return;

  // Download images in background with throttling
  setImmediate(async () => {
    for (const img of toDownload) {
      await galleryCacheModule.downloadGalleryImage(img.id, img.previewUrl, img.mimeType || "image/png");
      // Throttle: 100ms delay between downloads to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });
});

// ============================================
// Pending Events & Automation IPC Handlers
// ============================================

ipcMain.handle("pending:list", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { events: [], missedCount: 0, queuedCount: 0 };
  }
  const { groupId, limit } = payload || {};
  const rawEvents = automationEngine.getPendingEvents(groupId, limit);
  const missedCount = automationEngine.getMissedCount(groupId);
  const queuedCount = automationEngine.getQueuedCount(groupId);

  // Resolve event details for each pending event for display
  const events = rawEvents.map(event => {
    const resolvedDetails = automationEngine.resolveEventDetails(event.id);
    return {
      ...event,
      resolvedDetails
    };
  });

  return { events, missedCount, queuedCount };
});

ipcMain.handle("pending:action", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { ok: false, error: { message: "Automation not initialized" } };
  }
  const { pendingEventId, action, overrides } = payload || {};
  if (!pendingEventId || !action) {
    return { ok: false, error: { message: "Missing pendingEventId or action" } };
  }

  try {
    switch (action) {
      case "postNow":
        return await automationEngine.handleMissedEvent(pendingEventId, "postNow");
      case "reschedule":
        return await automationEngine.handleMissedEvent(pendingEventId, "reschedule");
        case "cancel": {
          const result = await automationEngine.handleMissedEvent(pendingEventId, "cancel");
            if (result?.ok && result.automationCleared && result.groupId && result.profileKey) {
              const profile = profiles?.[result.groupId]?.profiles?.[result.profileKey];
              if (profile) {
                profile.automation = { ...(profile.automation || {}), enabled: false };
                saveProfiles(profiles);
                if (automationEngine.isInitialized()) {
                  automationEngine.updatePendingEventsForProfile(result.groupId, result.profileKey, profile);
                }
                if (mainWindow) {
                  mainWindow.webContents.send("profiles:updated", { profiles });
                }
              }
            }
            return result;
          }
      case "edit":
        if (!overrides || typeof overrides !== "object") {
          return { ok: false, error: { message: "Missing overrides for edit action" } };
        }
        try {
          const nextOverrides = { ...overrides };
          if (nextOverrides.manualDate && nextOverrides.manualTime) {
            const times = buildEventTimes({
              manualDate: nextOverrides.manualDate,
              manualTime: nextOverrides.manualTime,
              timezone: nextOverrides.timezone,
              durationMinutes: nextOverrides.durationMinutes
            });
            nextOverrides.eventStartsAt = times.startsAtUtc;
          }
          delete nextOverrides.manualDate;
          delete nextOverrides.manualTime;
          return automationEngine.updatePendingEventOverrides(pendingEventId, nextOverrides);
        } catch (err) {
          return { ok: false, error: { message: err.message || "Invalid date or time." } };
        }
      default:
        return { ok: false, error: { message: `Unknown action: ${action}` } };
    }
  } catch (err) {
    return { ok: false, error: { message: err.message || "Action failed" } };
  }
});

ipcMain.handle("pending:getSettings", async () => {
  if (!automationEngine.isInitialized()) {
    return { displayLimit: 10 };
  }
  return automationEngine.getPendingSettings();
});

ipcMain.handle("pending:updateSettings", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { ok: false };
  }
  const { displayLimit } = payload || {};
  if (typeof displayLimit === "number" && displayLimit >= 1 && displayLimit <= 100) {
    automationEngine.updatePendingSettings({ displayLimit });
    return { ok: true };
  }
  return { ok: false, error: { message: "Invalid displayLimit" } };
});

ipcMain.handle("automation:getStatus", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { initialized: false };
  }
  const { groupId, profileKey } = payload || {};
  if (!groupId || !profileKey) {
    return { initialized: true, profileStatus: null };
  }
  const status = automationEngine.getAutomationStatus(groupId, profileKey);
  return { initialized: true, profileStatus: status };
});

ipcMain.handle("automation:resolveEvent", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { ok: false, error: { message: "Automation not initialized" } };
  }
  const { pendingEventId } = payload || {};
  if (!pendingEventId) {
    return { ok: false, error: { message: "Missing pendingEventId" } };
  }
  const resolved = automationEngine.resolveEventDetails(pendingEventId, profiles);
  if (!resolved) {
    return { ok: false, error: { message: "Could not resolve event details" } };
  }
  return { ok: true, eventDetails: resolved };
});

ipcMain.handle("automation:restore", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return { ok: false, error: { message: "Automation not initialized" } };
  }
  const { groupId, profileKey } = payload || {};
  if (!groupId || !profileKey) {
    return { ok: false, error: { message: "Missing groupId or profileKey" } };
  }
  return automationEngine.restoreDeletedEvents(groupId, profileKey);
});

ipcMain.handle("automation:getRestorableCount", async (_, payload) => {
  if (!automationEngine.isInitialized()) {
    return 0;
  }
  const { groupId, profileKey } = payload || {};
  if (!groupId || !profileKey) {
    return 0;
  }
  return automationEngine.getRestorableCount(groupId, profileKey);
});

app.whenReady().then(() => {
  initDebugLog();
  initializePaths();
  maybeImportProfiles();
  profiles = loadProfiles();
  const startHidden = shouldStartHiddenAtLogin();
  createWindow({ startHidden });
  if (IS_DEV && DEBUG_LOG_PATH) {
    console.log(`\n📄 Debug log file: ${DEBUG_LOG_PATH}\n`);
  }

  // Initialize automation engine after 2 seconds to allow UI to fully load
  setTimeout(() => {
    automationEngine.initializeAutomation({
      pendingEventsPath: PENDING_EVENTS_PATH,
      automationStatePath: AUTOMATION_STATE_PATH,
      profiles,
      createEventFn: async (groupId, eventData, startsAtUtc, endsAtUtc) => {
        // This function is called by the automation engine to create events
        try {
          await ensureCalendarPermission(groupId);
          const requestBody = {
            title: eventData.title,
            description: eventData.description,
            startsAt: startsAtUtc,
            endsAt: endsAtUtc,
            category: eventData.category,
            sendCreationNotification: eventData.sendCreationNotification ?? false,
            accessType: eventData.accessType,
            languages: eventData.languages || [],
            platforms: eventData.platforms || [],
            tags: eventData.tags || [],
            imageId: eventData.imageId || null,
            featured: Boolean(eventData.featured),
            isDraft: false,
            parentId: null,
            roleIds: Array.isArray(eventData.roleIds) ? eventData.roleIds : []
          };
          debugLog("createEvent (automation)", "Featured flag:", requestBody.featured);
          debugApiCall("createGroupCalendarEvent (automation)", { groupId, body: requestBody });
          const response = await vrchat.createGroupCalendarEvent({
            throwOnError: true,
            path: { groupId },
            body: requestBody
          });
          debugApiResponse("createGroupCalendarEvent (automation)", response);
          const eventId = getEventId(response.data);
          trackCreatedEvent(groupId, startsAtUtc, eventData.title);
          return { ok: true, eventId };
        } catch (err) {
          debugApiResponse("createGroupCalendarEvent (automation)", null, err);
          const status = err?.response?.status || null;
          return {
            ok: false,
            error: {
              status,
              code: status === 429 ? "UPCOMING_LIMIT" : null,
              message: err?.message || "Could not create event."
            }
          };
        }
      },
      onMissedEvent: (pendingEvent) => {
        // Notify renderer about missed events
        if (mainWindow) {
          mainWindow.webContents.send("automation:missed", pendingEvent);
        }
      },
      onEventCreated: (pendingEvent, eventId) => {
        // Notify renderer about successfully created events
        if (mainWindow) {
          const eventDetails = automationEngine.resolveEventDetails(pendingEvent.id, profiles);
          mainWindow.webContents.send("automation:created", { pendingEvent, eventId, eventDetails });
        }
        // Regenerate pending events to top-up the queue after a successful post.
        // This keeps the automation self-sustaining as events get published.
        const { groupId, profileKey } = pendingEvent;
        const profile = profiles?.[groupId]?.profiles?.[profileKey];
        if (profile?.automation?.enabled) {
          automationEngine.updatePendingEventsForProfile(groupId, profileKey, profile);
        }
        // Discord sync for automated events
        const details = automationEngine.resolveEventDetails(pendingEvent.id, profiles);
        if (details) {
          const startTime = new Date(pendingEvent.eventStartsAt);
          const durationMs = (details.duration || 120) * 60 * 1000;
          const endTime = new Date(startTime.getTime() + durationMs);
          tryDiscordSync(groupId, profileKey, details, startTime.toISOString(), endTime.toISOString());
          // Calendar webhook sync for automated events
          tryCalendarSync(groupId, profileKey, details, startTime.toISOString(), endTime.toISOString());
        }
      },
      debugLog: IS_DEV ? debugLog : () => {}
    });
  }, 2000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  destroyTray();
  finalizeDebugLog();
});

