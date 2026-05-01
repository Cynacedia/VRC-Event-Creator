const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage, Tray, Menu, safeStorage } = require("electron");
const { autoUpdater } = require("electron-updater");

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { DateTime } = require("luxon");
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { generateDateOptionsFromPatterns, safeZone } = require("./core/date-utils");
const automationEngine = require("./core/automation-engine");
const discord = require("./core/discord");
const ics = require("./core/ics");
const webhook = require("./core/webhook");
const { recurrenceToRRule } = require("./core/rrule");
const debugModule = require("./core/debug-log");
const galleryCacheModule = require("./core/gallery-cache");
const themeStoreModule = require("./core/theme-store");
const eckit = require("./core/eckit");

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
let SERIES_PATH;
let RASTERIZE_PATH;
let CACHE_PATH;
let SETTINGS_PATH;
let PENDING_EVENTS_PATH;
let AUTOMATION_STATE_PATH;
let GALLERY_CACHE_DIR;
let GALLERY_MANIFEST_PATH;
let KITS_DIR;
let WEBHOOK_IMAGES_DIR;
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
  SERIES_PATH = path.join(DATA_DIR, "series.json");
  RASTERIZE_PATH = path.join(DATA_DIR, "pending-rasterize.json");
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
  KITS_DIR = path.join(DATA_DIR, "kits");
  WEBHOOK_IMAGES_DIR = path.join(DATA_DIR, "webhook-images");
  eckit.loadKits(KITS_DIR);
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
  const validRanges = [7, 14, 30, 90, 180, 365];
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
      calendarReminders: [{ value: 30, unit: "minutes" }],
      modifyTimeRangeDays: 90
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
    calendarReminders: normalizeCalendarReminders(raw.calendarReminders),
    modifyTimeRangeDays: validRanges.includes(raw.modifyTimeRangeDays) ? raw.modifyTimeRangeDays : 90
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

/**
 * Create a Discord scheduled event. Returns a promise resolving to
 * { eventId, guildId } on success, or null if skipped/failed.
 */
async function tryDiscordSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc) {
  if (!settings.discordEnabled) return null;

  const groupData = profiles[groupId];
  if (!groupData) return null;

  const botToken = decryptToken(groupData.discordBotToken);
  const guildId = groupData.discordGuildId;
  if (!botToken || !guildId) return null;

  // Check event-level opt-out (from Create Event form)
  if (eventData?.discordSync === false) return null;

  // Check profile-level opt-in (existing templates must explicitly enable)
  const profile = groupData.profiles?.[profileKey];
  if (profile && profile.discordSync !== true) return null;

  try {
    // Resolve image base64 if available
    const imageBase64 = eventData.imageId
      ? await getImageBase64ForDiscord(eventData.imageId).catch(() => null)
      : null;

    const result = await discord.createDiscordScheduledEvent({
      botToken,
      guildId,
      name: eventData.title,
      description: eventData.description,
      startTime: startsAtUtc,
      endTime: endsAtUtc,
      imageBase64
    });

    if (!result.ok) {
      debugLog("discord", "Failed to create Discord event:", result.error);
      if (mainWindow) {
        mainWindow.webContents.send("discord:syncFailed", {
          eventTitle: eventData.title,
          error: result.error
        });
      }
      return null;
    }

    debugLog("discord", "Discord event created:", result.eventId);
    if (mainWindow) {
      mainWindow.webContents.send("discord:syncSuccess", {
        eventTitle: eventData.title
      });
    }
    return { eventId: result.eventId, guildId };
  } catch (err) {
    debugLog("discord", "Discord sync error:", err.message);
    return null;
  }
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

/**
 * Generate ICS content and build filename for an event.
 * Shared helper used by both tryWebhookPost (for attachment) and tryIcsAutoSave.
 * @returns {{ icsContent: string, filename: string }|null}
 */
function generateIcsForEvent(groupId, profileKey, eventData, startsAtUtc, endsAtUtc) {
  const groupData = profiles[groupId];
  if (!groupData) return null;

  const profile = groupData.profiles?.[profileKey];

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

  return { icsContent, filename };
}

/**
 * Check if ICS calendar creation is enabled for this event context.
 */
function isIcsEnabled(groupId, profileKey, eventData) {
  if (!settings.calendarEnabled) return false;
  if (eventData?.calendarCreate === false) return false;
  const profile = profiles[groupId]?.profiles?.[profileKey];
  if (profile && profile.calendarSync !== true) return false;
  return true;
}

/**
 * Post a message to a Discord webhook. Independent of Discord events and ICS.
 * If ICS is also enabled, attaches the .ics file. If a Discord event was created,
 * includes the event URL in the message (link mode instead of embed).
 * @param {string} groupId
 * @param {string} profileKey
 * @param {object} eventData
 * @param {string} startsAtUtc
 * @param {string} endsAtUtc
 * @param {{ eventId: string, guildId: string }|null} discordEvent - Discord event info if created
 */
function tryWebhookPost(groupId, profileKey, eventData, startsAtUtc, endsAtUtc, discordEvent) {
  // Check per-event opt-out
  if (eventData?.webhookPost === false) return;

  const groupData = profiles[groupId];
  if (!groupData) return;

  // Check profile-level opt-in
  const profile = groupData.profiles?.[profileKey];
  if (profile && profile.webhookPost !== true) return;

  // Webhook URL must exist
  const webhookUrl = decryptToken(groupData.webhookUrl);
  if (!webhookUrl) return;

  // Generate ICS if calendar is also enabled (attach to webhook)
  let icsContent = null;
  let icsFilename = null;
  if (isIcsEnabled(groupId, profileKey, eventData)) {
    const icsResult = generateIcsForEvent(groupId, profileKey, eventData, startsAtUtc, endsAtUtc);
    if (icsResult) {
      icsContent = icsResult.icsContent;
      icsFilename = icsResult.filename;
    }
  }

  const defaultAvatarUrl = `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/main/electron/app.png`;

  // Apply kit overrides if a valid kit exists for this group
  const hasGroupKit = eckit.hasKit(groupId);
  const kitAvatarUrl = hasGroupKit && groupData.webhookAvatarUrl ? groupData.webhookAvatarUrl : defaultAvatarUrl;
  const kitWebhookName = hasGroupKit && groupData.webhookDisplayName ? groupData.webhookDisplayName : undefined;

  // Custom message from event data (kit-unlocked feature)
  const customMessage = hasGroupKit && eventData?.webhookMessage ? eventData.webhookMessage : "";

  // Custom attachment from event data (kit-unlocked feature)
  const customImagePath = hasGroupKit && eventData?.webhookImagePath ? eventData.webhookImagePath : "";
  const customImageFilename = customImagePath ? path.basename(customImagePath) : null;
  const customImagePromise = customImagePath
    ? fs.promises.readFile(customImagePath).catch(() => null)
    : Promise.resolve(null);

  let webhookPromise;

  if (discordEvent) {
    // Discord event was created — post event link (+ optional .ics)
    const eventUrl = `https://discord.com/events/${discordEvent.guildId}/${discordEvent.eventId}`;
    const messageContent = customMessage ? `${customMessage}\n${eventUrl}` : eventUrl;
    webhookPromise = customImagePromise.then(customImageBuffer => {
      return webhook.sendWebhook({
        webhookUrl,
        icsContent,
        filename: icsFilename,
        content: messageContent,
        imageBuffer: customImageBuffer,
        imageFilename: customImageBuffer ? customImageFilename : null,
        avatarUrl: kitAvatarUrl,
        webhookName: kitWebhookName
      });
    });
  } else {
    // No Discord event — use embed with event details (+ optional .ics)
    const startUnix = Math.floor(new Date(startsAtUtc).getTime() / 1000);
    const endUnix = Math.floor(new Date(endsAtUtc).getTime() / 1000);

    // Apply kit embed color override
    const embedColor = hasGroupKit && groupData.webhookEmbedColor
      ? parseInt(groupData.webhookEmbedColor.replace("#", ""), 16) || 0x1FC3AD
      : 0x1FC3AD;

    const embed = {
      title: eventData.title,
      description: truncateText(eventData.description || "", 300),
      color: embedColor,
      fields: [
        { name: "\uD83D\uDCC6", value: `<t:${startUnix}:D>`, inline: true },
        { name: "\uD83D\uDD50", value: `<t:${startUnix}:t> \u2014 <t:${endUnix}:t>`, inline: true },
        { name: "\uD83D\uDC65", value: groupData.groupName || "VRChat Group", inline: true }
      ]
    };

    // Resolve event image + group icon (non-blocking, parallel)
    // Custom image takes priority over VRChat event image
    const imagePromise = customImagePath
      ? customImagePromise
      : (eventData.imageId ? getImageBufferForWebhook(eventData.imageId).catch(() => null) : Promise.resolve(null));
    const iconId = groupData.groupIconId || groupIconCache.get(groupId) || "";
    const iconPromise = iconId
      ? getImageBufferForWebhook(iconId).catch(() => null)
      : Promise.resolve(null);

    webhookPromise = Promise.all([imagePromise, iconPromise]).then(([imageBuffer, iconBuffer]) => {
      if (imageBuffer) {
        embed.image = { url: "attachment://banner.png" };
      }
      if (iconBuffer) {
        embed.thumbnail = { url: "attachment://icon.png" };
      }
      return webhook.sendWebhook({
        webhookUrl,
        icsContent,
        filename: icsFilename,
        content: customMessage || undefined,
        embed,
        imageBuffer,
        imageFilename: imageBuffer ? "banner.png" : null,
        iconBuffer,
        iconFilename: iconBuffer ? "icon.png" : null,
        avatarUrl: kitAvatarUrl,
        webhookName: kitWebhookName
      });
    });
  }

  webhookPromise.then(result => {
    if (!result.ok) {
      debugLog("webhook", "Failed to send webhook:", result.error);
      if (mainWindow) {
        mainWindow.webContents.send("webhook:syncFailed", {
          eventTitle: eventData.title,
          error: result.error
        });
      }
    } else {
      debugLog("webhook", "Webhook sent for:", eventData.title);
      if (mainWindow) {
        mainWindow.webContents.send("webhook:syncSuccess", {
          eventTitle: eventData.title
        });
      }
    }
  }).catch(err => {
    debugLog("webhook", "Webhook sync error:", err.message);
  });
}

/**
 * Auto-save an .ics calendar file to disk. Independent of webhook and Discord events.
 * Always runs when ICS is enabled, regardless of webhook state.
 * @param {string} groupId
 * @param {string} profileKey
 * @param {object} eventData
 * @param {string} startsAtUtc
 * @param {string} endsAtUtc
 */
function tryIcsAutoSave(groupId, profileKey, eventData, startsAtUtc, endsAtUtc) {
  if (!isIcsEnabled(groupId, profileKey, eventData)) return;

  const groupData = profiles[groupId];
  if (!groupData) return;

  const icsResult = generateIcsForEvent(groupId, profileKey, eventData, startsAtUtc, endsAtUtc);
  if (!icsResult) return;

  const { icsContent, filename } = icsResult;

  // Auto-create default save directory if not set
  if (!settings.calendarSaveDir) {
    const docsDir = app.getPath("documents");
    settings.calendarSaveDir = path.join(docsDir, "VRC Event Creator .ics");
    saveSettings(settings);
  }
  try {
    // Save into group subfolder: {saveDir}/{GroupName}/{filename}
    const safeGroupName = (groupData.groupName || "Unknown Group").replace(/[^a-zA-Z0-9_ -]/g, "").trim() || "Group";
    const groupDir = path.join(settings.calendarSaveDir, safeGroupName);
    fs.mkdirSync(groupDir, { recursive: true });
    const savePath = path.join(groupDir, filename);
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

/**
 * Format a recurrence object as a human-readable string for announcement messages.
 * E.g. "Weekly on Wednesdays, ends after 10 occurrences"
 */
function recurrenceToHumanString(recurrence) {
  if (!recurrence) return "";
  const dayNames = { MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun" };
  const interval = recurrence.interval || 1;
  const freq = recurrence.frequency || "weekly";
  const freqLabel = {
    daily: interval === 1 ? "Daily" : `Every ${interval} days`,
    weekly: interval === 1 ? "Weekly" : `Every ${interval} weeks`,
    monthly: interval === 1 ? "Monthly" : `Every ${interval} months`,
    yearly: interval === 1 ? "Yearly" : `Every ${interval} years`
  }[freq] || freq;
  const parts = [freqLabel];
  if (Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length) {
    const days = recurrence.daysOfWeek.map(d => dayNames[d] || d).join(", ");
    parts.push(`on ${days}`);
  }
  if (recurrence.end) {
    if (recurrence.end.type === "afterOccurrences") {
      parts.push(`for ${recurrence.end.count} occurrences`);
    } else if (recurrence.end.type === "afterDate") {
      parts.push(`until ${(recurrence.end.date || "").slice(0, 10)}`);
    }
  }
  return parts.join(" ");
}

/**
 * Run announcement actions for a series creation/update.
 * - Generates a single .ics with RRULE if calendarCreate is enabled
 * - Posts a webhook announcement (with optional .ics attachment) if webhookPost is enabled
 * Discord recurring event creation is deferred (more complex API surface).
 *
 * @param {string} groupId
 * @param {object} seriesData - { seriesId, label, recurrence, eventTemplate, ... }
 * @param {string} startsAtUtc - first occurrence start
 * @param {string} endsAtUtc - first occurrence end
 * @param {object} announcementFlags - { calendarCreate, webhookPost, customMessage }
 * @param {string} verb - "created" | "updated"
 */
function trySeriesAnnouncements(groupId, seriesData, startsAtUtc, endsAtUtc, announcementFlags, verb) {
  const groupData = profiles[groupId];
  if (!groupData) return;
  const { calendarCreate, discordSync, webhookPost, customMessage } = announcementFlags || {};

  const tpl = seriesData.eventTemplate || {};
  const label = seriesData.label || tpl.title || "Series";
  const humanRule = recurrenceToHumanString(seriesData.recurrence);

  // Create a recurring Discord scheduled event mirroring the VRChat recurrence
  if (discordSync && settings.discordEnabled && verb === "created") {
    const botToken = decryptToken(groupData.discordBotToken);
    const guildId = groupData.discordGuildId;
    if (botToken && guildId) {
      (async () => {
        try {
          const imageBase64 = tpl.imageId
            ? await getImageBase64ForDiscord(tpl.imageId).catch(() => null)
            : null;
          const result = await discord.createDiscordScheduledEvent({
            botToken,
            guildId,
            name: tpl.title || label,
            description: tpl.description || "",
            startTime: startsAtUtc,
            endTime: endsAtUtc,
            imageBase64,
            recurrence: seriesData.recurrence
          });
          if (!result.ok) {
            debugLog("series", "Discord recurring event failed:", result.error);
            if (mainWindow) {
              mainWindow.webContents.send("discord:syncFailed", {
                eventTitle: label,
                error: result.error
              });
            }
          } else {
            debugLog("series", "Discord recurring event created:", result.eventId);
            if (mainWindow) {
              mainWindow.webContents.send("discord:syncSuccess", {
                eventTitle: label
              });
            }
          }
        } catch (err) {
          debugLog("series", "Discord recurring event error:", err.message);
        }
      })();
    }
  }

  // Generate ICS with RRULE if calendar is enabled
  let icsContent = null;
  let icsFilename = null;
  if (calendarCreate && settings.calendarEnabled) {
    const rrule = recurrenceToRRule(seriesData.recurrence);
    const startMs = new Date(startsAtUtc).getTime();
    const uid = `${groupId}-series-${seriesData.seriesId}-${startMs}@vrceventcreator`;
    icsContent = ics.generateIcsString({
      title: tpl.title || label,
      description: tpl.description || "",
      startTime: startsAtUtc,
      endTime: endsAtUtc,
      location: "VRChat",
      uid,
      sequence: 0,
      reminders: [],
      rrule
    });
    const safeTitle = (tpl.title || label).replace(/[^a-zA-Z0-9_ -]/g, "").trim().slice(0, 50);
    icsFilename = `${safeTitle} - Series.ics`;

    // Auto-save the .ics to disk
    try {
      if (!settings.calendarSaveDir) {
        const docsDir = app.getPath("documents");
        settings.calendarSaveDir = path.join(docsDir, "VRC Event Creator .ics");
        saveSettings(settings);
      }
      const safeGroupName = (groupData.groupName || "Unknown Group").replace(/[^a-zA-Z0-9_ -]/g, "").trim() || "Group";
      const groupDir = path.join(settings.calendarSaveDir, safeGroupName);
      fs.mkdirSync(groupDir, { recursive: true });
      const savePath = path.join(groupDir, icsFilename);
      fs.writeFileSync(savePath, icsContent, "utf8");
      debugLog("series", "Series ICS saved:", savePath);
      if (mainWindow) {
        mainWindow.webContents.send("calendar:autoSaved", {
          eventTitle: `${label} (series)`,
          filePath: savePath
        });
      }
    } catch (err) {
      debugLog("series", "Series ICS save failed:", err.message);
    }
  }

  // Post webhook announcement if enabled
  if (webhookPost) {
    const webhookUrl = decryptToken(groupData.webhookUrl);
    if (!webhookUrl) return;

    const defaultAvatarUrl = `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/main/electron/app.png`;
    const hasGroupKit = eckit.hasKit(groupId);
    const kitAvatarUrl = hasGroupKit && groupData.webhookAvatarUrl ? groupData.webhookAvatarUrl : defaultAvatarUrl;
    const kitWebhookName = hasGroupKit && groupData.webhookDisplayName ? groupData.webhookDisplayName : undefined;

    const startUnix = Math.floor(new Date(startsAtUtc).getTime() / 1000);
    const endUnix = Math.floor(new Date(endsAtUtc).getTime() / 1000);
    const embedColor = hasGroupKit && groupData.webhookEmbedColor
      ? parseInt(groupData.webhookEmbedColor.replace("#", ""), 16) || 0x1FC3AD
      : 0x1FC3AD;

    const titlePrefix = verb === "updated" ? "Updated:" : "New:";
    const embed = {
      title: `${titlePrefix} ${tpl.title || label}`,
      description: truncateText(tpl.description || "", 300),
      color: embedColor,
      fields: [
        { name: "🔁", value: humanRule || "Recurring", inline: false },
        { name: "📆", value: `<t:${startUnix}:D>`, inline: true },
        { name: "🕐", value: `<t:${startUnix}:t> — <t:${endUnix}:t>`, inline: true },
        { name: "👥", value: groupData.groupName || "VRChat Group", inline: true }
      ]
    };

    // Resolve event image + group icon
    const customImagePath = hasGroupKit && customMessage?.imagePath ? customMessage.imagePath : "";
    const customImagePromise = customImagePath
      ? fs.promises.readFile(customImagePath).catch(() => null)
      : Promise.resolve(null);
    const imagePromise = customImagePath
      ? customImagePromise
      : (tpl.imageId ? getImageBufferForWebhook(tpl.imageId).catch(() => null) : Promise.resolve(null));
    const iconId = groupData.groupIconId || groupIconCache.get(groupId) || "";
    const iconPromise = iconId
      ? getImageBufferForWebhook(iconId).catch(() => null)
      : Promise.resolve(null);

    const userMessage = hasGroupKit && customMessage?.text ? customMessage.text : "";

    Promise.all([imagePromise, iconPromise]).then(([imageBuffer, iconBuffer]) => {
      if (imageBuffer) embed.image = { url: "attachment://banner.png" };
      if (iconBuffer) embed.thumbnail = { url: "attachment://icon.png" };
      return webhook.sendWebhook({
        webhookUrl,
        icsContent,
        filename: icsFilename,
        content: userMessage || undefined,
        embed,
        imageBuffer,
        imageFilename: imageBuffer ? "banner.png" : null,
        iconBuffer,
        iconFilename: iconBuffer ? "icon.png" : null,
        avatarUrl: kitAvatarUrl,
        webhookName: kitWebhookName
      });
    }).then(result => {
      if (!result?.ok) {
        debugLog("series", "Series webhook failed:", result?.error);
      } else {
        debugLog("series", `Series webhook sent (${verb}):`, label);
      }
    }).catch(err => {
      debugLog("series", "Series webhook error:", err.message);
    });
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
      // Kit-unlocked webhook customization (user-editable when kit is active)
      webhookDisplayName: typeof groupData.webhookDisplayName === "string" ? groupData.webhookDisplayName : "",
      webhookAvatarUrl: typeof groupData.webhookAvatarUrl === "string" ? groupData.webhookAvatarUrl : "",
      webhookEmbedColor: typeof groupData.webhookEmbedColor === "string" ? groupData.webhookEmbedColor : "",
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

// Series storage — local metadata for VRChat native recurring series
let series = {};

function normalizeRecurrence(raw) {
  if (!raw || typeof raw !== "object") return null;
  const validFreq = ["daily", "weekly", "monthly", "yearly"];
  const frequency = validFreq.includes(raw.frequency) ? raw.frequency : "weekly";
  const interval = Number.isFinite(raw.interval) && raw.interval >= 1 ? Math.floor(raw.interval) : 1;
  const timezone = typeof raw.timezone === "string" && raw.timezone ? raw.timezone : "UTC";
  const validDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const daysOfWeek = Array.isArray(raw.daysOfWeek)
    ? raw.daysOfWeek.filter(d => validDays.includes(d))
    : [];
  let end = null;
  if (raw.end && typeof raw.end === "object") {
    if (raw.end.type === "afterOccurrences" && Number.isFinite(raw.end.count) && raw.end.count >= 1) {
      end = { type: "afterOccurrences", count: Math.floor(raw.end.count) };
    } else if (raw.end.type === "afterDate" && typeof raw.end.date === "string") {
      end = { type: "afterDate", date: raw.end.date };
    }
  }
  const out = { frequency, interval, timezone };
  if (daysOfWeek.length) out.daysOfWeek = daysOfWeek;
  if (end) out.end = end;
  return out;
}

function normalizeSeriesEventTemplate(raw) {
  if (!raw || typeof raw !== "object") raw = {};
  return {
    title: typeof raw.title === "string" ? raw.title : "",
    description: typeof raw.description === "string" ? raw.description : "",
    category: typeof raw.category === "string" ? raw.category : "hangout",
    duration: Number.isFinite(raw.duration) && raw.duration > 0 ? Math.floor(raw.duration) : 120,
    accessType: ["public", "group"].includes(raw.accessType) ? raw.accessType : "public",
    languages: Array.isArray(raw.languages) ? raw.languages.filter(s => typeof s === "string") : [],
    platforms: Array.isArray(raw.platforms) ? raw.platforms.filter(s => typeof s === "string") : [],
    tags: Array.isArray(raw.tags) ? raw.tags.filter(s => typeof s === "string") : [],
    imageId: typeof raw.imageId === "string" ? raw.imageId : null,
    roleIds: Array.isArray(raw.roleIds) ? raw.roleIds.filter(s => typeof s === "string") : [],
    sendCreationNotification: Boolean(raw.sendCreationNotification)
  };
}

function normalizeSeries(raw) {
  if (!raw || typeof raw !== "object") return {};
  const output = {};
  Object.entries(raw).forEach(([groupId, groupSeries]) => {
    if (!groupId || typeof groupSeries !== "object") return;
    output[groupId] = {};
    Object.entries(groupSeries).forEach(([seriesId, entry]) => {
      if (!seriesId || !entry || typeof entry !== "object") return;
      const recurrence = normalizeRecurrence(entry.recurrence);
      if (!recurrence) return;
      output[groupId][seriesId] = {
        label: typeof entry.label === "string" ? entry.label : "Untitled Series",
        groupId,
        seriesId,
        createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
        lastSyncedAt: typeof entry.lastSyncedAt === "string" ? entry.lastSyncedAt : null,
        firstOccurrenceUtc: typeof entry.firstOccurrenceUtc === "string" ? entry.firstOccurrenceUtc : null,
        firstOccurrenceEndUtc: typeof entry.firstOccurrenceEndUtc === "string" ? entry.firstOccurrenceEndUtc : null,
        recurrence,
        eventTemplate: normalizeSeriesEventTemplate(entry.eventTemplate)
      };
    });
  });
  return output;
}

function loadSeries() {
  try {
    const raw = JSON.parse(fs.readFileSync(SERIES_PATH, "utf8"));
    return normalizeSeries(raw);
  } catch (err) {
    return {};
  }
}

function saveSeries(nextSeries) {
  series = normalizeSeries(nextSeries);
  fs.writeFileSync(SERIES_PATH, JSON.stringify(series, null, 2));
}

// ----------------------------------------------------------------------------
// Rasterize queue — persistent queue of post-regeneration work that needs to
// happen against VRChat's API. Modifications captured before deleting an old
// series are saved here so they survive crashes and rate-limit cooldowns.
// Entries are drained on app start and again every hour by drainRasterizeQueue.
// ----------------------------------------------------------------------------
let rasterizeQueue = [];
let rasterizeDraining = false;

// Strip series-only fields from a standalone create body and ensure the
// fields createGroupCalendarEvent expects are present. Pre-fix entries
// queued before we knew the right shape get repaired on load.
// Returns { cleaned, migrated } so the caller can reset retry state when the
// shape was actually wrong (so the user doesn't keep waiting on a dead backoff).
function normalizeStandaloneBody(payload) {
  if (!payload || typeof payload !== "object") return { cleaned: payload, migrated: false };
  const hadStaleFields = ("seriesId" in payload) || ("parentId" in payload)
    || ("occurrenceKind" in payload) || ("recurrence" in payload)
    || payload.isDraft === undefined || payload.sendCreationNotification === undefined;
  const cleaned = { ...payload };
  delete cleaned.seriesId;
  delete cleaned.parentId;
  delete cleaned.occurrenceKind;
  delete cleaned.recurrence;
  if (cleaned.isDraft === undefined) cleaned.isDraft = false;
  if (cleaned.sendCreationNotification === undefined) cleaned.sendCreationNotification = false;
  if (cleaned.featured === undefined) cleaned.featured = false;
  return { cleaned, migrated: hadStaleFields };
}

function normalizeRasterizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.groupId || typeof raw.groupId !== "string") return null;
  const validTypes = ["standalone", "occurrenceUpdate"];
  if (!validTypes.includes(raw.type)) return null;
  if (!raw.payload || typeof raw.payload !== "object") return null;
  const id = typeof raw.id === "string" && raw.id ? raw.id : `rast_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  let payload = raw.payload;
  let bodyMigrated = false;
  if (raw.type === "standalone") {
    const result = normalizeStandaloneBody(raw.payload);
    payload = result.cleaned;
    bodyMigrated = result.migrated;
  }
  return {
    id,
    groupId: raw.groupId,
    type: raw.type,
    payload,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    // If we migrated the body shape, the prior backoff is meaningless — clear
    // retry state so the next drain pass actually attempts the entry.
    attemptCount: bodyMigrated ? 0 : (Number.isFinite(raw.attemptCount) && raw.attemptCount >= 0 ? Math.floor(raw.attemptCount) : 0),
    nextRetryAt: bodyMigrated ? null : (typeof raw.nextRetryAt === "string" ? raw.nextRetryAt : null),
    lastError: bodyMigrated ? null : (raw.lastError && typeof raw.lastError === "object"
      ? { status: raw.lastError.status || null, message: typeof raw.lastError.message === "string" ? raw.lastError.message : "" }
      : null),
    sourceSeriesLabel: typeof raw.sourceSeriesLabel === "string" ? raw.sourceSeriesLabel : "",
    sourceSeriesId: typeof raw.sourceSeriesId === "string" ? raw.sourceSeriesId : ""
  };
}

function normalizeRasterizeQueue(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeRasterizeEntry).filter(Boolean);
}

function loadRasterizeQueue() {
  try {
    const raw = JSON.parse(fs.readFileSync(RASTERIZE_PATH, "utf8"));
    return normalizeRasterizeQueue(raw);
  } catch (err) {
    return [];
  }
}

function saveRasterizeQueue() {
  try {
    fs.writeFileSync(RASTERIZE_PATH, JSON.stringify(rasterizeQueue, null, 2));
  } catch (err) {
    debugLog("rasterize", "Failed to save queue:", err.message);
  }
}

function enqueueRasterizeEntry(entry) {
  const normalized = normalizeRasterizeEntry(entry);
  if (!normalized) return null;
  rasterizeQueue.push(normalized);
  saveRasterizeQueue();
  return normalized;
}

function removeRasterizeEntry(id) {
  const idx = rasterizeQueue.findIndex(e => e.id === id);
  if (idx >= 0) {
    rasterizeQueue.splice(idx, 1);
    saveRasterizeQueue();
  }
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
    // Auto-open dev tools on startup (temporary for series API test harness)
    mainWindow.webContents.openDevTools({ mode: "detach" });
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
          featured: Boolean(featured),
          // Series fields (native VRChat recurring event support)
          seriesId: getEventField(event, "seriesId") || null,
          occurrenceKind: getEventField(event, "occurrenceKind") || null,
          occurrenceModified: Boolean(getEventField(event, "occurrenceModified"))
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

// TEMPORARY: renderer-side debug logger that writes to the persistent debug log
// so we can read it after the fact. Remove with the rest of the test harness.
ipcMain.handle("debug:log", (_, payload) => {
  const { context = "renderer", message = "" } = payload || {};
  debugLog(`renderer:${context}`, message);
  return true;
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

ipcMain.handle("discord:updateGroupDiscord", (_, { groupId, discordBotToken, discordGuildId, webhookDisplayName, webhookAvatarUrl, webhookEmbedColor }) => {
  if (!groupId || !profiles[groupId]) return { ok: false, error: "Group not found." };
  if (typeof discordBotToken === "string") {
    profiles[groupId].discordBotToken = encryptToken(discordBotToken);
  }
  if (typeof discordGuildId === "string") {
    profiles[groupId].discordGuildId = discordGuildId;
  }
  // Kit-unlocked customization fields
  if (typeof webhookDisplayName === "string") profiles[groupId].webhookDisplayName = webhookDisplayName;
  if (typeof webhookAvatarUrl === "string") profiles[groupId].webhookAvatarUrl = webhookAvatarUrl;
  if (typeof webhookEmbedColor === "string") profiles[groupId].webhookEmbedColor = webhookEmbedColor;
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

ipcMain.handle("eckit:selectImage", async () => {
  if (!mainWindow) return { ok: false };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Webhook Attachment",
    filters: [
      { name: "Media", extensions: ["png", "jpg", "jpeg", "gif", "webp", "mp3", "mp4", "webm"] }
    ],
    properties: ["openFile"]
  });
  if (result.canceled || !result.filePaths?.length) return { ok: false, cancelled: true };
  const filePath = result.filePaths[0];
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 8 * 1024 * 1024) {
      return { ok: false, error: "File must be under 8 MB." };
    }
    // Copy to app data so the image persists even if the original is moved/deleted
    if (!WEBHOOK_IMAGES_DIR) {
      debugLog("eckit:selectImage", "WEBHOOK_IMAGES_DIR not initialized");
      return { ok: true, filePath };
    }
    const buffer = fs.readFileSync(filePath);
    fs.mkdirSync(WEBHOOK_IMAGES_DIR, { recursive: true });
    const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16);
    const ext = path.extname(filePath).toLowerCase() || ".png";
    const destPath = path.join(WEBHOOK_IMAGES_DIR, `${hash}${ext}`);
    fs.writeFileSync(destPath, buffer);
    return { ok: true, filePath: destPath };
  } catch (err) {
    debugLog("eckit:selectImage", "Error copying image:", err.message);
    return { ok: false, error: `Could not read file: ${err.message}` };
  }
});


// --- EC Kit IPC handlers ---

ipcMain.handle("eckit:import", async () => {
  if (!mainWindow) return { ok: false, error: "No window." };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Import Webhook Kit",
    filters: [{ name: "EC Kit", extensions: ["eckit"] }],
    properties: ["openFile"]
  });
  if (result.canceled || !result.filePaths?.length) return { ok: false, cancelled: true };
  return eckit.importKit(result.filePaths[0], KITS_DIR);
});

ipcMain.handle("eckit:hasKit", (_, groupId) => {
  return eckit.hasKit(groupId);
});

ipcMain.handle("eckit:getKit", (_, groupId) => {
  return eckit.getKit(groupId);
});

ipcMain.handle("eckit:getKitGroupIds", () => {
  return eckit.getKitGroupIds();
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

// --- Series IPC handlers (VRChat native recurring events) ---

ipcMain.handle("series:list", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId) return {};
  return series[groupId] || {};
});

ipcMain.handle("series:create", async (_, payload) => {
  try {
    const { groupId, label, eventTemplate, recurrence, startsAtUtc, endsAtUtc, announcements } = payload || {};
    if (!groupId || !eventTemplate || !recurrence || !startsAtUtc || !endsAtUtc) {
      throw new Error("Missing series payload fields.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);

    const requestBody = {
      title: eventTemplate.title,
      description: eventTemplate.description || "",
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      category: eventTemplate.category || "hangout",
      sendCreationNotification: Boolean(eventTemplate.sendCreationNotification),
      accessType: eventTemplate.accessType || "public",
      languages: Array.isArray(eventTemplate.languages) ? eventTemplate.languages : [],
      platforms: Array.isArray(eventTemplate.platforms) ? eventTemplate.platforms : [],
      tags: Array.isArray(eventTemplate.tags) ? eventTemplate.tags : [],
      imageId: eventTemplate.imageId || null,
      featured: false,
      isDraft: false,
      roleIds: Array.isArray(eventTemplate.roleIds) ? eventTemplate.roleIds : [],
      // Series fields (not in SDK types yet — passed raw)
      occurrenceKind: "series",
      recurrence: normalizeRecurrence(recurrence)
    };

    debugApiCall("createGroupCalendarEvent (series)", { groupId, body: requestBody });
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugApiResponse("createGroupCalendarEvent (series)", response);

    const seriesId = getEventId(response.data);
    if (!seriesId) {
      return { ok: false, error: { message: "Series created but no ID returned." } };
    }

    if (!series[groupId]) series[groupId] = {};
    const stored = {
      label: label || eventTemplate.title || "Untitled Series",
      groupId,
      seriesId,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      firstOccurrenceUtc: startsAtUtc,
      firstOccurrenceEndUtc: endsAtUtc,
      recurrence: normalizeRecurrence(recurrence),
      eventTemplate: normalizeSeriesEventTemplate(eventTemplate)
    };
    series[groupId][seriesId] = stored;
    saveSeries(series);

    // Fire announcement actions (webhook, ICS) — fire and forget
    if (announcements) {
      try {
        trySeriesAnnouncements(groupId, stored, startsAtUtc, endsAtUtc, announcements, "created");
      } catch (annErr) {
        debugLog("series", "Series announcement error:", annErr.message);
      }
    }

    return { ok: true, seriesId, data: response.data };
  } catch (err) {
    debugApiResponse("createGroupCalendarEvent (series)", null, err);
    return { ok: false, error: shapeApiError(err, "Could not create series.") };
  }
});

ipcMain.handle("series:update", async (_, payload) => {
  try {
    const {
      groupId, seriesId, eventTemplate, recurrence, label,
      startsAtUtc, endsAtUtc, announcements,
      modificationStrategy,   // "keep" | "discard" | undefined (default discard)
      modifiedOccurrences     // [{ id, startsAtUtc, body }] — required when strategy === "keep"
    } = payload || {};
    if (!groupId || !seriesId) {
      throw new Error("Missing series payload fields.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);

    // Build minimal request body — only include fields that are present
    const requestBody = {};
    if (eventTemplate) {
      if (typeof eventTemplate.title === "string") requestBody.title = eventTemplate.title;
      if (typeof eventTemplate.description === "string") requestBody.description = eventTemplate.description;
      if (typeof eventTemplate.category === "string") requestBody.category = eventTemplate.category;
      if (typeof eventTemplate.accessType === "string") requestBody.accessType = eventTemplate.accessType;
      if (Array.isArray(eventTemplate.languages)) requestBody.languages = eventTemplate.languages;
      if (Array.isArray(eventTemplate.platforms)) requestBody.platforms = eventTemplate.platforms;
      if (Array.isArray(eventTemplate.tags)) requestBody.tags = eventTemplate.tags;
      if (Array.isArray(eventTemplate.roleIds)) requestBody.roleIds = eventTemplate.roleIds;
      if (eventTemplate.imageId !== undefined) requestBody.imageId = eventTemplate.imageId;
    }
    if (recurrence) {
      requestBody.recurrence = normalizeRecurrence(recurrence);
    }
    // startsAt / endsAt drive the first occurrence's date+time. Without these,
    // VRChat receives a no-op recurrence update and the series stays anchored
    // at its original first occurrence — silently. Always pass through when
    // the renderer supplied them.
    if (typeof startsAtUtc === "string" && startsAtUtc) requestBody.startsAt = startsAtUtc;
    if (typeof endsAtUtc === "string" && endsAtUtc) requestBody.endsAt = endsAtUtc;

    debugApiCall("updateGroupCalendarEvent (series)", { groupId, seriesId, body: requestBody });
    try {
      await vrchat.updateGroupCalendarEvent({
        throwOnError: true,
        path: { groupId, calendarId: seriesId },
        body: requestBody
      });
    } catch (parseErr) {
      // VRChat returns 200 OK with empty body for series updates, which trips up the SDK's JSON parser.
      // Suppress that specific case but rethrow real errors.
      if (parseErr?.message !== "Unexpected end of JSON input") {
        throw parseErr;
      }
    }

    // Update local metadata
    if (!series[groupId]) series[groupId] = {};
    const existing = series[groupId][seriesId] || {};
    const stored = {
      ...existing,
      label: typeof label === "string" ? label : (existing.label || "Untitled Series"),
      groupId,
      seriesId,
      lastSyncedAt: new Date().toISOString(),
      // Preserve the original first occurrence timestamps (only update if explicitly provided)
      firstOccurrenceUtc: startsAtUtc || existing.firstOccurrenceUtc || null,
      firstOccurrenceEndUtc: endsAtUtc || existing.firstOccurrenceEndUtc || null,
      recurrence: recurrence ? normalizeRecurrence(recurrence) : existing.recurrence,
      eventTemplate: eventTemplate
        ? normalizeSeriesEventTemplate({ ...existing.eventTemplate, ...eventTemplate })
        : existing.eventTemplate
    };
    series[groupId][seriesId] = stored;
    saveSeries(series);

    // Mod-preservation flow: when the user chose "Keep", snapshot the
    // pre-update modifications, then classify them against the (just
    // regenerated) new occurrences. Same logic as series:regenerate, but the
    // seriesId stays the same since this was a PUT not DELETE+CREATE.
    if (modificationStrategy === "keep" && Array.isArray(modifiedOccurrences) && modifiedOccurrences.length) {
      const sourceSeriesLabel = stored.label || label || "Untitled Series";
      const snapshotEntries = [];
      for (const mod of modifiedOccurrences) {
        if (!mod || !mod.body) continue;
        const b = mod.body;
        const standaloneBody = {
          title: b.title || "",
          description: b.description || "",
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          category: b.category || "hangout",
          sendCreationNotification: false,
          accessType: b.accessType || "public",
          languages: Array.isArray(b.languages) ? b.languages : [],
          platforms: Array.isArray(b.platforms) ? b.platforms : [],
          tags: Array.isArray(b.tags) ? b.tags : [],
          imageId: b.imageId || null,
          featured: Boolean(b.featured),
          isDraft: Boolean(b.isDraft),
          ...(Array.isArray(b.roleIds) ? { roleIds: b.roleIds } : {})
        };
        const entry = enqueueRasterizeEntry({
          groupId,
          type: "standalone",
          payload: standaloneBody,
          sourceSeriesLabel,
          sourceSeriesId: seriesId,
          createdAt: new Date().toISOString()
        });
        if (entry) snapshotEntries.push({ entry, originalDate: isoDateOnly(mod.startsAtUtc) });
      }

      // Classify against the regenerated occurrences (still under the same seriesId).
      // Two important things:
      //   1. Skip requestGet — its 10s dedupe window will hand back the
      //      pre-update list cached by the renderer's recent
      //      seriesCheckModifications call, which makes us classify against
      //      stale occurrence IDs and silently drop modifications.
      //   2. Poll for the new occurrences — VRChat regenerates asynchronously
      //      after the PUT returns 200, and the lag is variable. We retry up
      //      to 5 times (10s total) until the new occurrences actually appear.
      let newOccurrencesByDate = new Map();
      try {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          await new Promise(r => setTimeout(r, 2000));
          debugApiCall(`getGroupCalendarEvents (post-update classify, attempt ${attempt + 1}/5)`, { groupId });
          const listResp = await vrchat.getGroupCalendarEvents({
            path: { groupId },
            query: { n: 100 }
          });
          const events = getCalendarEventList(listResp.data);
          const matchingForSeries = events.filter(ev => getEventField(ev, "seriesId") === seriesId);
          if (matchingForSeries.length > 0) {
            for (const ev of matchingForSeries) {
              const startIso = parseEventDateValue(getEventStartValue(ev))?.toUTC().toISO();
              const dateKey = isoDateOnly(startIso);
              if (dateKey && !newOccurrencesByDate.has(dateKey)) {
                newOccurrencesByDate.set(dateKey, getEventId(ev));
              }
            }
            debugLog("rasterize", `Post-update poll attempt ${attempt + 1}: found ${matchingForSeries.length} occurrences with seriesId ${seriesId}, ${newOccurrencesByDate.size} unique dates.`);
            break;
          }
          debugLog("rasterize", `Post-update poll attempt ${attempt + 1}: 0 occurrences yet for seriesId ${seriesId}, retrying.`);
        }
        if (newOccurrencesByDate.size === 0) {
          debugLog("rasterize", `Post-update classify: gave up after 5 polls — VRChat hasn't regenerated yet. Modifications will stay as standalones.`);
        }
        let convertedCount = 0;
        for (const entry of rasterizeQueue) {
          if (entry.groupId !== groupId) continue;
          if (entry.type !== "standalone") continue;
          const sameSourceById = entry.sourceSeriesId && entry.sourceSeriesId === seriesId;
          const sameSourceByLabel = !entry.sourceSeriesId && entry.sourceSeriesLabel === sourceSeriesLabel;
          if (!sameSourceById && !sameSourceByLabel) continue;
          const originalDate = isoDateOnly(entry.payload?.startsAt);
          if (!originalDate) continue;
          const matchOccurrenceId = newOccurrencesByDate.get(originalDate);
          if (matchOccurrenceId) {
            entry.type = "occurrenceUpdate";
            entry.payload = { occurrenceId: matchOccurrenceId, body: entry.payload };
            convertedCount += 1;
          }
        }
        debugLog("rasterize", `Post-update classify: ${newOccurrencesByDate.size} new occurrences, converted ${convertedCount} standalone(s) to PUTs.`);
        saveRasterizeQueue();
      } catch (classifyErr) {
        debugLog("rasterize", "Could not classify overlaps post-update:", classifyErr.message);
      }
      // Kick off a drain in the background
      drainRasterizeQueue().catch(err => debugLog("rasterize", "Drain error:", err.message));
    }

    // Fire announcement actions when explicitly requested (and we have start/end times for ICS)
    if (announcements && startsAtUtc && endsAtUtc) {
      try {
        trySeriesAnnouncements(groupId, stored, startsAtUtc, endsAtUtc, announcements, "updated");
      } catch (annErr) {
        debugLog("series", "Series announcement error:", annErr.message);
      }
    }

    return { ok: true, pendingRasterize: rasterizeQueue.length };
  } catch (err) {
    debugApiResponse("updateGroupCalendarEvent (series)", null, err);
    return { ok: false, error: shapeApiError(err, "Could not update series.") };
  }
});

ipcMain.handle("series:delete", async (_, payload) => {
  try {
    const { groupId, seriesId } = payload || {};
    if (!groupId || !seriesId) {
      throw new Error("Missing series payload fields.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);

    debugApiCall("deleteGroupCalendarEvent (series)", { groupId, seriesId });
    await vrchat.deleteGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId: seriesId }
    });
    debugApiResponse("deleteGroupCalendarEvent (series)", { ok: true });

    if (series[groupId]?.[seriesId]) {
      delete series[groupId][seriesId];
      saveSeries(series);
    }

    return { ok: true };
  } catch (err) {
    debugApiResponse("deleteGroupCalendarEvent (series)", null, err);
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not delete series."
      }
    };
  }
});

ipcMain.handle("series:checkModifications", async (_, payload) => {
  try {
    const { groupId, seriesId } = payload || {};
    if (!groupId || !seriesId) {
      throw new Error("Missing series payload fields.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);

    const response = await requestGet(
      "getGroupCalendarEvents",
      { path: { groupId }, query: { n: 100 } },
      () => vrchat.getGroupCalendarEvents({
        path: { groupId },
        query: { n: 100 }
      })
    );
    const results = getCalendarEventList(response.data);
    const modified = results.filter(e =>
      getEventField(e, "seriesId") === seriesId &&
      Boolean(getEventField(e, "occurrenceModified"))
    );
    return {
      ok: true,
      count: modified.length,
      occurrences: modified.map(e => {
        const startsAtUtc = parseEventDateValue(getEventStartValue(e))?.toUTC().toISO() || null;
        const endsAtUtc = parseEventDateValue(getEventField(e, "endsAt"))?.toUTC().toISO() || null;
        return {
          id: getEventId(e),
          title: getEventField(e, "title") || "",
          startsAtUtc,
          endsAtUtc,
          // Full body suitable for rasterization (POST as standalone) or merge (PUT to occurrence)
          body: {
            title: getEventField(e, "title") || "",
            description: getEventField(e, "description") || "",
            category: getEventField(e, "category") || "hangout",
            accessType: getEventField(e, "accessType") || "public",
            languages: Array.isArray(getEventField(e, "languages")) ? getEventField(e, "languages") : [],
            platforms: Array.isArray(getEventField(e, "platforms")) ? getEventField(e, "platforms") : [],
            tags: Array.isArray(getEventField(e, "tags")) ? getEventField(e, "tags") : [],
            imageId: getEventField(e, "imageId") || null,
            roleIds: Array.isArray(getEventField(e, "roleIds")) ? getEventField(e, "roleIds") : [],
            featured: Boolean(getEventField(e, "featured")),
            isDraft: Boolean(getEventField(e, "isDraft")),
            startsAt: startsAtUtc,
            endsAt: endsAtUtc
          }
        };
      })
    };
  } catch (err) {
    return {
      ok: false,
      error: {
        status: err?.response?.status || null,
        message: err?.message || "Could not check modifications."
      }
    };
  }
});

ipcMain.handle("series:reconcile", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId || !series[groupId]) {
    return { ok: true, orphaned: [] };
  }
  await ensureUser();
  await ensureCalendarPermission(groupId);

  const orphaned = [];
  const localIds = Object.keys(series[groupId]);
  for (const seriesId of localIds) {
    try {
      await vrchat.getGroupCalendarEvent({
        throwOnError: true,
        path: { groupId, calendarId: seriesId }
      });
      // Update lastSyncedAt on success
      if (series[groupId][seriesId]) {
        series[groupId][seriesId].lastSyncedAt = new Date().toISOString();
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        orphaned.push(seriesId);
      }
    }
  }
  if (orphaned.length) {
    saveSeries(series);
  }
  return { ok: true, orphaned };
});

// ----------------------------------------------------------------------------
// Series regeneration: delete an existing series and create a new one with a
// changed recurrence rule, while preserving the data of any modified
// occurrences either by re-applying them to overlapping new occurrences (PUT)
// or rasterizing them as standalone events (POST). All POST/PUT work is
// queued in pending-rasterize.json so it survives crashes and rate limits.
// ----------------------------------------------------------------------------

function isRateLimitErr(err) {
  return err?.response?.status === 429;
}

/** Pull a retry-after suggestion (seconds) from a 429 response, defaulting to 60min. */
function rateLimitRetrySeconds(err) {
  const headers = err?.response?.headers;
  if (headers) {
    const ra = headers.get?.("retry-after") ?? headers["retry-after"];
    if (ra) {
      const n = Number(ra);
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
  }
  return 60 * 60;
}

/** Build a renderer-friendly error object from an SDK error. Replaces opaque
 *  429s with a clear "rate limited — try again in Xm" message so the toast
 *  is actionable instead of just whatever VRChat happened to write. */
function shapeApiError(err, fallbackMessage) {
  const status = err?.response?.status || null;
  if (status === 429) {
    const seconds = rateLimitRetrySeconds(err);
    const minutes = Math.max(1, Math.round(seconds / 60));
    return {
      status: 429,
      message: `VRChat rate limit hit. Try again in ~${minutes} minute${minutes === 1 ? "" : "s"}.`
    };
  }
  return {
    status,
    message: err?.message || fallbackMessage
  };
}

function isoDateOnly(iso) {
  if (typeof iso !== "string" || !iso) return null;
  return iso.slice(0, 10);
}

/** Single drain pass over the rasterize queue. Stops on rate limit errors and
 *  records nextRetryAt so the next tick (or app restart) picks up cleanly. */
async function drainRasterizeQueue() {
  if (rasterizeDraining) return { processed: 0, remaining: rasterizeQueue.length };
  rasterizeDraining = true;
  let processed = 0;
  try {
    if (!vrchat) {
      // Not authed yet — try later.
      return { processed: 0, remaining: rasterizeQueue.length };
    }
    const now = Date.now();
    // Process a snapshot to avoid mutation surprises during await
    const snapshot = rasterizeQueue.slice();
    for (const entry of snapshot) {
      // Respect nextRetryAt
      if (entry.nextRetryAt && Date.parse(entry.nextRetryAt) > now) continue;
      try {
        if (entry.type === "standalone") {
          debugApiCall("createGroupCalendarEvent (rasterize)", { groupId: entry.groupId, body: entry.payload });
          await vrchat.createGroupCalendarEvent({
            throwOnError: true,
            path: { groupId: entry.groupId },
            body: entry.payload
          });
          debugApiResponse("createGroupCalendarEvent (rasterize)", { ok: true });
        } else if (entry.type === "occurrenceUpdate") {
          const { occurrenceId, body } = entry.payload || {};
          if (!occurrenceId) {
            debugLog("rasterize", "Missing occurrenceId, dropping entry", entry.id);
            removeRasterizeEntry(entry.id);
            continue;
          }
          debugApiCall("updateGroupCalendarEvent (rasterize)", { groupId: entry.groupId, occurrenceId, body });
          await vrchat.updateGroupCalendarEvent({
            throwOnError: true,
            path: { groupId: entry.groupId, calendarId: occurrenceId },
            body
          });
          debugApiResponse("updateGroupCalendarEvent (rasterize)", { ok: true });
        }
        removeRasterizeEntry(entry.id);
        processed += 1;
      } catch (err) {
        entry.attemptCount += 1;
        entry.lastError = {
          status: err?.response?.status || null,
          message: err?.message || "Unknown error"
        };
        if (isRateLimitErr(err)) {
          // Push retry to ~1 hour from now (matches existing automation engine cadence)
          entry.nextRetryAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          debugLog("rasterize", `Rate limited on ${entry.id}, retrying after ${entry.nextRetryAt}`);
          saveRasterizeQueue();
          // Stop draining for this group — further work for the same group will also 429
          break;
        }
        // Non-429 error: back off but keep entry so user can intervene
        entry.nextRetryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        debugLog("rasterize", `Failed entry ${entry.id} (${entry.lastError.status}): ${entry.lastError.message}`);
        saveRasterizeQueue();
      }
    }
  } finally {
    rasterizeDraining = false;
  }
  return { processed, remaining: rasterizeQueue.length };
}

ipcMain.handle("series:regenerate", async (_, payload) => {
  try {
    const {
      groupId,
      seriesId: oldSeriesId,
      label,
      eventTemplate,
      recurrence,
      startsAtUtc,
      endsAtUtc,
      announcements,
      modificationStrategy,   // "keep" | "discard"
      modifiedOccurrences     // [{ id, startsAtUtc, body }] from renderer's pre-flight
    } = payload || {};
    if (!groupId || !oldSeriesId || !eventTemplate || !recurrence || !startsAtUtc || !endsAtUtc) {
      throw new Error("Missing regeneration payload fields.");
    }
    await ensureUser();
    await ensureCalendarPermission(groupId);

    const sourceSeriesLabel = series[groupId]?.[oldSeriesId]?.label || label || "Untitled Series";
    const mods = Array.isArray(modifiedOccurrences) ? modifiedOccurrences : [];

    // Order matters: create the new series FIRST. If create fails, nothing is
    // destroyed and the user can retry without data loss. We accept a brief
    // window where both old and new series exist if the subsequent delete
    // fails — much better than the previous order which lost the old series
    // when create failed.
    const requestBody = {
      title: eventTemplate.title,
      description: eventTemplate.description || "",
      startsAt: startsAtUtc,
      endsAt: endsAtUtc,
      category: eventTemplate.category || "hangout",
      sendCreationNotification: Boolean(eventTemplate.sendCreationNotification),
      accessType: eventTemplate.accessType || "public",
      languages: Array.isArray(eventTemplate.languages) ? eventTemplate.languages : [],
      platforms: Array.isArray(eventTemplate.platforms) ? eventTemplate.platforms : [],
      tags: Array.isArray(eventTemplate.tags) ? eventTemplate.tags : [],
      imageId: eventTemplate.imageId || null,
      featured: false,
      isDraft: false,
      roleIds: Array.isArray(eventTemplate.roleIds) ? eventTemplate.roleIds : [],
      occurrenceKind: "series",
      recurrence: normalizeRecurrence(recurrence)
    };
    debugApiCall("createGroupCalendarEvent (regenerate)", { groupId, body: requestBody });
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugApiResponse("createGroupCalendarEvent (regenerate)", response);

    const newSeriesId = getEventId(response.data);
    if (!newSeriesId) {
      return { ok: false, error: { message: "Series regenerated but no ID returned." } };
    }

    // Now snapshot modifications to the persistent queue. Past this point, if
    // anything fails, modifications are recoverable from pending-rasterize.json.
    // The standalone body must match what createGroupCalendarEvent expects for
    // a non-series event — strip series-related fields, add isDraft and
    // sendCreationNotification.
    const snapshotEntries = [];
    if (modificationStrategy === "keep" && mods.length) {
      for (const mod of mods) {
        if (!mod || !mod.body) continue;
        const b = mod.body;
        const standaloneBody = {
          title: b.title || "",
          description: b.description || "",
          startsAt: b.startsAt,
          endsAt: b.endsAt,
          category: b.category || "hangout",
          // Hardcoded false: we don't want to fire a "new event" notification
          // for a rasterized event since the original announcement already happened.
          sendCreationNotification: false,
          accessType: b.accessType || "public",
          languages: Array.isArray(b.languages) ? b.languages : [],
          platforms: Array.isArray(b.platforms) ? b.platforms : [],
          tags: Array.isArray(b.tags) ? b.tags : [],
          imageId: b.imageId || null,
          featured: Boolean(b.featured),
          // Preserve the user's draft state if they had one; otherwise default published.
          isDraft: Boolean(b.isDraft),
          ...(Array.isArray(b.roleIds) ? { roleIds: b.roleIds } : {})
        };
        const entry = enqueueRasterizeEntry({
          groupId,
          type: "standalone",
          payload: standaloneBody,
          sourceSeriesLabel,
          sourceSeriesId: oldSeriesId,
          createdAt: new Date().toISOString()
        });
        if (entry) snapshotEntries.push({ entry, originalDate: isoDateOnly(mod.startsAtUtc) });
      }
    }

    // Delete the old series. If this fails the new series is already up; the
    // user has duplicates briefly but no data is lost. Errors here are
    // non-fatal — log and continue.
    try {
      debugApiCall("deleteGroupCalendarEvent (regenerate)", { groupId, oldSeriesId });
      await vrchat.deleteGroupCalendarEvent({
        throwOnError: true,
        path: { groupId, calendarId: oldSeriesId }
      });
      debugApiResponse("deleteGroupCalendarEvent (regenerate)", { ok: true });
      if (series[groupId]?.[oldSeriesId]) {
        delete series[groupId][oldSeriesId];
        saveSeries(series);
      }
    } catch (delErr) {
      debugApiResponse("deleteGroupCalendarEvent (regenerate)", null, delErr);
      debugLog("series", `Old series ${oldSeriesId} not deleted (${delErr?.response?.status || "?"}); user may need to remove manually.`);
    }

    // Save new series record
    if (!series[groupId]) series[groupId] = {};
    const stored = {
      label: label || sourceSeriesLabel,
      groupId,
      seriesId: newSeriesId,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      firstOccurrenceUtc: startsAtUtc,
      firstOccurrenceEndUtc: endsAtUtc,
      recurrence: normalizeRecurrence(recurrence),
      eventTemplate: normalizeSeriesEventTemplate(eventTemplate)
    };
    series[groupId][newSeriesId] = stored;
    saveSeries(series);

    // Post-create: convert overlapping standalone queue entries to occurrence
    // PUTs. We sweep both this attempt's entries AND any leftover from prior
    // failed attempts that target the same source series — those represent
    // committed user intent ("Keep") that survived the failure and shouldn't
    // be left as standalones if the new series now hits their dates.
    // Skip requestGet (its dedupe cache may serve a pre-create snapshot from
    // a recent seriesCheckModifications call) and poll for the new occurrences
    // — VRChat regenerates asynchronously after the create returns.
    let newOccurrencesByDate = new Map();
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await new Promise(r => setTimeout(r, 2000));
        debugApiCall(`getGroupCalendarEvents (post-create classify, attempt ${attempt + 1}/5)`, { groupId });
        const listResp = await vrchat.getGroupCalendarEvents({
          path: { groupId },
          query: { n: 100 }
        });
        const events = getCalendarEventList(listResp.data);
        const matchingForSeries = events.filter(ev => getEventField(ev, "seriesId") === newSeriesId);
        if (matchingForSeries.length > 0) {
          for (const ev of matchingForSeries) {
            const startIso = parseEventDateValue(getEventStartValue(ev))?.toUTC().toISO();
            const dateKey = isoDateOnly(startIso);
            if (dateKey && !newOccurrencesByDate.has(dateKey)) {
              newOccurrencesByDate.set(dateKey, getEventId(ev));
            }
          }
          debugLog("rasterize", `Post-create poll attempt ${attempt + 1}: found ${matchingForSeries.length} occurrences with seriesId ${newSeriesId}, ${newOccurrencesByDate.size} unique dates.`);
          break;
        }
        debugLog("rasterize", `Post-create poll attempt ${attempt + 1}: 0 occurrences yet for seriesId ${newSeriesId}, retrying.`);
      }
      if (newOccurrencesByDate.size === 0) {
        debugLog("rasterize", `Post-create classify: gave up after 5 polls — VRChat hasn't regenerated yet. Modifications will stay as standalones.`);
      }

      // Identify which queue entries to sweep. Match by:
      //   - Same group, AND
      //   - Same sourceSeriesId (preferred), OR same sourceSeriesLabel as fallback
      //     for entries written before sourceSeriesId was tracked, AND
      //   - Type still "standalone" (already-converted entries are skipped)
      let convertedCount = 0;
      for (const entry of rasterizeQueue) {
        if (entry.groupId !== groupId) continue;
        if (entry.type !== "standalone") continue;
        const sameSourceById = entry.sourceSeriesId && entry.sourceSeriesId === oldSeriesId;
        const sameSourceByLabel = !entry.sourceSeriesId && entry.sourceSeriesLabel === sourceSeriesLabel;
        if (!sameSourceById && !sameSourceByLabel) continue;
        // Get the originalDate. For entries from this attempt we have it in
        // snapshotEntries; for older entries we read it from the payload's startsAt.
        const originalDate = isoDateOnly(entry.payload?.startsAt);
        if (!originalDate) continue;
        const matchOccurrenceId = newOccurrencesByDate.get(originalDate);
        if (matchOccurrenceId) {
          entry.type = "occurrenceUpdate";
          entry.payload = { occurrenceId: matchOccurrenceId, body: entry.payload };
          convertedCount += 1;
        }
      }
      if (convertedCount > 0) {
        debugLog("rasterize", `Converted ${convertedCount} standalone entries to occurrence updates after regenerate.`);
      }
      saveRasterizeQueue();
    } catch (err) {
      debugLog("rasterize", "Could not classify overlaps post-create:", err.message);
      // Non-fatal — entries stay as standalones, which is the safe fallback
    }

    // Fire announcements for the new series
    if (announcements) {
      try {
        trySeriesAnnouncements(groupId, stored, startsAtUtc, endsAtUtc, announcements, "created");
      } catch (annErr) {
        debugLog("series", "Series announcement error:", annErr.message);
      }
    }

    // Kick off a drain in the background — no await
    drainRasterizeQueue().catch(err => debugLog("rasterize", "Drain error:", err.message));

    return {
      ok: true,
      newSeriesId,
      data: response.data,
      pendingRasterize: rasterizeQueue.length
    };
  } catch (err) {
    debugApiResponse("series:regenerate", null, err);
    return { ok: false, error: shapeApiError(err, "Could not regenerate series.") };
  }
});

ipcMain.handle("series:rasterizeStatus", async () => {
  return {
    ok: true,
    count: rasterizeQueue.length,
    entries: rasterizeQueue.map(e => ({
      id: e.id,
      groupId: e.groupId,
      type: e.type,
      attemptCount: e.attemptCount,
      nextRetryAt: e.nextRetryAt,
      lastError: e.lastError,
      sourceSeriesLabel: e.sourceSeriesLabel,
      createdAt: e.createdAt
    }))
  };
});

ipcMain.handle("series:rasterizeDrain", async () => {
  return await drainRasterizeQueue();
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
    // Post-creation actions: Discord event, webhook, and ICS are independent
    tryDiscordSync(groupId, profileKey, eventData, startsAtUtc, endsAtUtc).then(discordEvent => {
      tryWebhookPost(groupId, profileKey, eventData, startsAtUtc, endsAtUtc, discordEvent);
    });
    tryIcsAutoSave(groupId, profileKey, eventData, startsAtUtc, endsAtUtc);
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
  // Log raw event fields for recurring event API discovery (SDK may lag behind VRChat API)
  const rawResults = getCalendarEventList(response.data);
  if (rawResults.length > 0) {
    const knownFields = new Set([
      "id", "title", "description", "startsAt", "endsAt", "createdAt", "updatedAt",
      "deletedAt", "category", "accessType", "featured", "isDraft", "imageId", "imageUrl",
      "languages", "platforms", "roleIds", "tags", "type", "ownerId",
      "interestedUserCount", "userInterest", "hostEarlyJoinMinutes",
      "guestEarlyJoinMinutes", "closeInstanceAfterEndMinutes", "usesInstanceOverflow",
      "durationInMs", "occurrenceKind", "recurrence", "seriesId", "occurrenceModified"
    ]);
    const sampleEvent = rawResults[0];
    const allFields = Object.keys(sampleEvent);
    const unknownFields = allFields.filter(k => !knownFields.has(k));
    debugLog("API:discovery", `CalendarEvent fields (${allFields.length} total, ${unknownFields.length} unknown):`, allFields);
    if (unknownFields.length > 0) {
      debugLog("API:discovery", "Unknown fields:", unknownFields);
      const unknownData = {};
      unknownFields.forEach(k => { unknownData[k] = sampleEvent[k]; });
      debugLog("API:discovery", "Unknown field values:", unknownData);
    }
  }
  const results = rawResults;
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

// --- TEMPORARY: Series API test harness (remove before release) ---

ipcMain.handle("test:createSeries", async (_, payload) => {
  const { groupId } = payload || {};
  if (!groupId) throw new Error("Missing groupId");
  await ensureUser();
  await ensureCalendarPermission(groupId);

  const now = new Date();
  const startsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours

  const requestBody = {
    title: "EC Series Test",
    description: "Testing series creation via API — safe to delete",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    category: "hangout",
    sendCreationNotification: false,
    accessType: "group",
    languages: ["eng"],
    platforms: ["standalonewindows", "android"],
    tags: [],
    isDraft: false,
    parentId: null,
    roleIds: [],
    // Series-specific fields (not in SDK types yet)
    occurrenceKind: "series",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      timezone: "America/Chicago",
      daysOfWeek: ["WE"],
      end: {
        type: "afterOccurrences",
        count: 4
      }
    }
  };

  debugLog("test:createSeries", "Request body:", requestBody);
  try {
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugLog("test:createSeries", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:createSeries", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

ipcMain.handle("test:fetchEvent", async (_, payload) => {
  const { groupId, calendarId } = payload || {};
  if (!groupId || !calendarId) throw new Error("Missing groupId or calendarId");
  await ensureUser();

  debugLog("test:fetchEvent", "Fetching:", { groupId, calendarId });
  try {
    const response = await vrchat.getGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId }
    });
    debugLog("test:fetchEvent", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:fetchEvent", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

ipcMain.handle("test:deleteSeries", async (_, payload) => {
  const { groupId, calendarId } = payload || {};
  if (!groupId || !calendarId) throw new Error("Missing groupId or calendarId");
  await ensureUser();
  await ensureCalendarPermission(groupId);

  debugLog("test:deleteSeries", "Deleting:", { groupId, calendarId });
  try {
    const response = await vrchat.deleteGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId }
    });
    debugLog("test:deleteSeries", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:deleteSeries", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

ipcMain.handle("test:updateSeries", async (_, payload) => {
  const { groupId, calendarId, recurrence, fields = {} } = payload || {};
  if (!groupId || !calendarId) throw new Error("Missing groupId or calendarId");
  await ensureUser();
  await ensureCalendarPermission(groupId);

  const requestBody = { ...fields };
  if (recurrence !== undefined) requestBody.recurrence = recurrence;

  debugLog("test:updateSeries", "Request body:", requestBody);
  try {
    const response = await vrchat.updateGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId },
      body: requestBody
    });
    debugLog("test:updateSeries", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:updateSeries", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

ipcMain.handle("test:updateOccurrence", async (_, payload) => {
  const { groupId, calendarId, fields = {} } = payload || {};
  if (!groupId || !calendarId) throw new Error("Missing groupId or calendarId");
  await ensureUser();
  await ensureCalendarPermission(groupId);

  debugLog("test:updateOccurrence", "Request body:", fields);
  try {
    const response = await vrchat.updateGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId },
      body: fields
    });
    debugLog("test:updateOccurrence", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:updateOccurrence", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

ipcMain.handle("test:createWithParentId", async (_, payload) => {
  const { groupId, parentId } = payload || {};
  if (!groupId || !parentId) throw new Error("Missing groupId or parentId");
  await ensureUser();
  await ensureCalendarPermission(groupId);

  const now = new Date();
  const startsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

  const requestBody = {
    title: "EC ParentId Test",
    description: "Testing if parentId links a new event to an existing series",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    category: "hangout",
    sendCreationNotification: false,
    accessType: "group",
    languages: ["eng"],
    platforms: ["standalonewindows", "android"],
    tags: [],
    isDraft: false,
    parentId,
    roleIds: []
  };

  debugLog("test:createWithParentId", "Request body:", requestBody);
  try {
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugLog("test:createWithParentId", "Response:", JSON.stringify(response.data, null, 2));
    return { ok: true, data: response.data };
  } catch (err) {
    debugLog("test:createWithParentId", "Error:", err?.response?.status, err?.response?.data || err?.message);
    return { ok: false, status: err?.response?.status, error: err?.response?.data || err?.message };
  }
});

// --- END TEMPORARY ---

app.whenReady().then(() => {
  initDebugLog();
  initializePaths();
  maybeImportProfiles();
  profiles = loadProfiles();
  series = loadSeries();
  rasterizeQueue = loadRasterizeQueue();
  // Persist any normalize-time migrations so future loads don't re-migrate.
  if (rasterizeQueue.length) saveRasterizeQueue();
  const startHidden = shouldStartHiddenAtLogin();
  createWindow({ startHidden });
  if (IS_DEV) {
    const logPath = debugModule.getLogPath?.() || "(unknown)";
    console.log(`\n📄 Debug log file: ${logPath}\n`);
  }

  // Drain pending rasterize queue 30s after launch (gives auth time to settle),
  // then every hour. Runs are no-ops when the queue is empty or auth isn't ready.
  setTimeout(() => {
    drainRasterizeQueue().catch(err => debugLog("rasterize", "Startup drain error:", err.message));
  }, 30 * 1000);
  setInterval(() => {
    drainRasterizeQueue().catch(err => debugLog("rasterize", "Hourly drain error:", err.message));
  }, 60 * 60 * 1000);

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
          // Post-creation actions: Discord event, webhook, and ICS are independent
          tryDiscordSync(groupId, profileKey, details, startTime.toISOString(), endTime.toISOString()).then(discordEvent => {
            tryWebhookPost(groupId, profileKey, details, startTime.toISOString(), endTime.toISOString(), discordEvent);
          });
          tryIcsAutoSave(groupId, profileKey, details, startTime.toISOString(), endTime.toISOString());
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

