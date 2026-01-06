const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage } = require("electron");
const { autoUpdater } = require("electron-updater");

const path = require("path");
const fs = require("fs");
const { DateTime } = require("luxon");
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { generateDateOptionsFromPatterns, safeZone } = require("./core/date-utils");

// Disable GPU cache to suppress warnings
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

const APP_NAME = "VRChat Event Creator";
const IS_DEV = !app.isPackaged;

// Debug logging for API calls (only in dev mode)
// Debug log file path (created after app is ready)
let DEBUG_LOG_PATH = null;

function initDebugLog() {
  if (!IS_DEV) return;
  const logDir = app.getPath("userData");
  DEBUG_LOG_PATH = path.join(logDir, "debug-api.json");
  // Initialize with empty array
  try {
    fs.writeFileSync(DEBUG_LOG_PATH, "[\n", "utf8");
  } catch (e) {
    // Ignore
  }
}

let debugLogFirstEntry = true;

function writeDebugLog(entry) {
  if (!IS_DEV || !DEBUG_LOG_PATH) return;
  try {
    const prefix = debugLogFirstEntry ? "" : ",\n";
    debugLogFirstEntry = false;
    fs.appendFileSync(DEBUG_LOG_PATH, prefix + JSON.stringify(entry, null, 2), "utf8");
  } catch (e) {
    // Ignore write errors
  }
}

function finalizeDebugLog() {
  if (!IS_DEV || !DEBUG_LOG_PATH) return;
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, "\n]", "utf8");
  } catch (e) {
    // Ignore
  }
}

// ANSI color codes for terminal output
const DEBUG_COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  white: "\x1b[37m"
};

function debugLog(context, ...args) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    const timeStr = `${DEBUG_COLORS.dim}${timestamp}${DEBUG_COLORS.reset}`;
    console.log(`${timeStr} ${DEBUG_COLORS.cyan}[${context}]${DEBUG_COLORS.reset}`, ...args);
    // Write JSON entry to log file
    writeDebugLog({
      type: "log",
      timestamp,
      context,
      message: args.map(a => typeof a === "object" ? a : String(a))
    });
  }
}

function debugApiCall(name, params) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    const divider = `${DEBUG_COLORS.blue}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
    const header = `${DEBUG_COLORS.bgBlue}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ▶ API REQUEST: ${name} ${DEBUG_COLORS.reset}`;
    console.log("");
    console.log(divider);
    console.log(header);
    console.log(divider);
    console.log(`${DEBUG_COLORS.yellow}Parameters:${DEBUG_COLORS.reset}`);
    console.log(JSON.stringify(params, null, 2));
    // Write JSON entry to log file
    writeDebugLog({
      type: "request",
      timestamp,
      api: name,
      params
    });
  }
}

function debugApiResponse(name, response, error = null) {
  if (IS_DEV) {
    const timestamp = new Date().toISOString();
    if (error) {
      const divider = `${DEBUG_COLORS.red}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
      const header = `${DEBUG_COLORS.bgRed}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ✖ API ERROR: ${name} ${DEBUG_COLORS.reset}`;
      console.log(divider);
      console.log(header);
      console.log(divider);
      console.log(`${DEBUG_COLORS.red}Status:${DEBUG_COLORS.reset} ${error?.response?.status || "N/A"} ${error?.response?.statusText || ""}`);
      console.log(`${DEBUG_COLORS.red}Message:${DEBUG_COLORS.reset} ${error?.message || "Unknown error"}`);
      if (error?.response?.data) {
        console.log(`${DEBUG_COLORS.red}Response Data:${DEBUG_COLORS.reset}`);
        console.log(JSON.stringify(error.response.data, null, 2));
      }
      if (error?.stack) {
        console.log(`${DEBUG_COLORS.dim}Stack: ${error.stack}${DEBUG_COLORS.reset}`);
      }
      console.log(divider);
      console.log("");
      // Write JSON entry to log file
      writeDebugLog({
        type: "error",
        timestamp,
        api: name,
        status: error?.response?.status || null,
        statusText: error?.response?.statusText || null,
        message: error?.message || "Unknown error",
        responseData: error?.response?.data || null
      });
    } else {
      const divider = `${DEBUG_COLORS.green}${"─".repeat(60)}${DEBUG_COLORS.reset}`;
      const header = `${DEBUG_COLORS.bgGreen}${DEBUG_COLORS.white}${DEBUG_COLORS.bright} ✔ API RESPONSE: ${name} ${DEBUG_COLORS.reset}`;
      console.log(divider);
      console.log(header);
      console.log(divider);
      console.log(`${DEBUG_COLORS.green}Status:${DEBUG_COLORS.reset} ${response?.status || "N/A"} ${response?.statusText || ""}`);
      console.log(`${DEBUG_COLORS.green}Data Type:${DEBUG_COLORS.reset} ${typeof response?.data}`);
      if (response?.data && typeof response.data === "object") {
        const keys = Array.isArray(response.data) ? `Array[${response.data.length}]` : Object.keys(response.data).join(", ");
        console.log(`${DEBUG_COLORS.green}Data Keys:${DEBUG_COLORS.reset} ${keys}`);
      }
      console.log(`${DEBUG_COLORS.magenta}Response Data:${DEBUG_COLORS.reset}`);
      console.log(JSON.stringify(response?.data, null, 2));
      console.log(divider);
      console.log("");
      // Write JSON entry to log file
      writeDebugLog({
        type: "response",
        timestamp,
        api: name,
        status: response?.status || null,
        statusText: response?.statusText || null,
        data: response?.data || null
      });
    }
  }
}
const pkg = (() => {
  const pkgPath = path.join(__dirname, "..", "package.json");
  return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
})();
const APP_VERSION = pkg.version;
const UPDATE_REPO_OWNER = pkg.build?.publish?.owner || "Cynacedia";
const UPDATE_REPO_NAME = pkg.build?.publish?.repo || "VRC-Event-Creator";
const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;

// Auto-updater configuration
autoUpdater.autoDownload = true;
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

// Force update checks in dev mode for testing
if (IS_DEV) {
  autoUpdater.forceDevUpdateConfig = true;
}

let mainWindow = null;
let currentUser = null;
let profiles = {};
let twoFactorRequest = null;

// These will be initialized after app is ready
let DATA_DIR;
let PROFILES_PATH;
let CACHE_PATH;
let SETTINGS_PATH;
let THEMES_PATH;
let settings;
let vrchat;
let themeStore;
let THEME_PRESETS_DIR;
let THEME_PRESETS_SEED_PATH;
let THEME_PRESETS_BUNDLED_DIR;
const RESERVED_THEME_PRESET_KEYS = new Set(["default", "wired", "custom", "blue"]);
const groupPermissionCache = new Map();
const groupPrivacyCache = new Map();
const groupRolesCache = new Map();
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
  THEMES_PATH = path.join(DATA_DIR, "themes.json");
  THEME_PRESETS_DIR = path.join(DATA_DIR, "themes");
  THEME_PRESETS_SEED_PATH = path.join(THEME_PRESETS_DIR, ".seeded");
  THEME_PRESETS_BUNDLED_DIR = path.join(__dirname, "themes");
  settings = loadSettings();
  const rawThemeStore = loadThemeStoreRaw();
  themeStore = normalizeThemeStore(rawThemeStore);
  seedThemePresets();
  migrateThemeStorePresets(rawThemeStore);
  vrchat = createClient();
}

function normalizeSettings(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return { ...raw };
}

function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
    return normalizeSettings(raw);
  } catch (err) {
    return normalizeSettings({});
  }
}

function loadThemeStoreRaw() {
  try {
    return JSON.parse(fs.readFileSync(THEMES_PATH, "utf8"));
  } catch (err) {
    return {};
  }
}

function normalizeThemeStore(raw) {
  let selectedPreset = typeof raw?.selectedPreset === "string" ? raw.selectedPreset : "default";
  if (selectedPreset === "blue") {
    selectedPreset = "default";
  }
  const customColors = raw?.customColors && typeof raw.customColors === "object" ? raw.customColors : null;
  return { selectedPreset, customColors };
}

function saveThemeStore(nextStore) {
  themeStore = normalizeThemeStore(nextStore);
  fs.writeFileSync(THEMES_PATH, JSON.stringify(themeStore, null, 2));
  return themeStore;
}

function sanitizeThemePresetKey(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim();
}

function ensureThemePresetDir() {
  if (!THEME_PRESETS_DIR) {
    return;
  }
  fs.mkdirSync(THEME_PRESETS_DIR, { recursive: true });
}

function loadSeededThemeKeys() {
  try {
    if (fs.existsSync(THEME_PRESETS_SEED_PATH)) {
      const content = fs.readFileSync(THEME_PRESETS_SEED_PATH, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(k => String(k).toLowerCase()));
      }
    }
  } catch (err) {
    // Ignore read errors
  }
  return new Set();
}

function saveSeededThemeKeys(keys) {
  try {
    fs.writeFileSync(THEME_PRESETS_SEED_PATH, JSON.stringify(Array.from(keys)));
  } catch (err) {
    // Ignore write errors
  }
}

function seedThemePresets() {
  if (!THEME_PRESETS_DIR || !THEME_PRESETS_BUNDLED_DIR) {
    return;
  }
  if (!fs.existsSync(THEME_PRESETS_BUNDLED_DIR)) {
    return;
  }
  ensureThemePresetDir();
  const seededKeys = loadSeededThemeKeys();
  const bundled = fs.readdirSync(THEME_PRESETS_BUNDLED_DIR)
    .filter(file => file.toLowerCase().endsWith(".json"));
  bundled.forEach(file => {
    const key = path.basename(file, ".json").toLowerCase();
    // Skip if already seeded
    if (seededKeys.has(key)) {
      return;
    }
    const source = path.join(THEME_PRESETS_BUNDLED_DIR, file);
    const target = path.join(THEME_PRESETS_DIR, file);
    try {
      fs.copyFileSync(source, target);
      seededKeys.add(key);
    } catch (err) {
      // Ignore copy errors
    }
  });
  saveSeededThemeKeys(seededKeys);
}

function readThemePresetFile(filePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const key = path.basename(filePath, ".json");
    if (!key || RESERVED_THEME_PRESET_KEYS.has(key.toLowerCase())) {
      return null;
    }
    let colors = null;
    if (raw?.colors && typeof raw.colors === "object") {
      colors = raw.colors;
    } else if (raw && typeof raw === "object" && !raw.name) {
      colors = raw;
    }
    if (!colors || typeof colors !== "object") {
      return null;
    }
    const name = typeof raw?.name === "string" && raw.name.trim() ? raw.name.trim() : key;
    return { key, name, colors };
  } catch (err) {
    return null;
  }
}

function loadThemePresets() {
  if (!THEME_PRESETS_DIR) {
    return [];
  }
  ensureThemePresetDir();
  let files = [];
  try {
    files = fs.readdirSync(THEME_PRESETS_DIR).filter(file => file.toLowerCase().endsWith(".json"));
  } catch (err) {
    return [];
  }
  const presets = [];
  files.forEach(file => {
    const preset = readThemePresetFile(path.join(THEME_PRESETS_DIR, file));
    if (preset) {
      presets.push(preset);
    }
  });
  return presets;
}

function writeThemePresetFile({ key, name, colors, allowOverwrite }) {
  ensureThemePresetDir();
  const safeName = typeof name === "string" ? name.trim() : "";
  if (!safeName) {
    throw new Error("Theme name required.");
  }
  let baseKey = sanitizeThemePresetKey(key || safeName);
  if (!baseKey || RESERVED_THEME_PRESET_KEYS.has(baseKey.toLowerCase())) {
    baseKey = sanitizeThemePresetKey(safeName) || "theme";
  }
  let finalKey = baseKey;
  let targetPath = path.join(THEME_PRESETS_DIR, `${finalKey}.json`);
  if (!allowOverwrite || !fs.existsSync(targetPath)) {
    let index = 1;
    while (fs.existsSync(targetPath) || RESERVED_THEME_PRESET_KEYS.has(finalKey.toLowerCase())) {
      finalKey = `${baseKey}-${index}`;
      targetPath = path.join(THEME_PRESETS_DIR, `${finalKey}.json`);
      index += 1;
    }
  }
  const payload = { name: safeName, colors: colors || {} };
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2));
  return { key: finalKey, name: safeName, colors: payload.colors };
}

function saveThemePreset(payload) {
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const colors = payload?.colors && typeof payload.colors === "object" ? payload.colors : null;
  if (!name || !colors) {
    throw new Error("Invalid theme preset.");
  }
  const key = typeof payload?.key === "string" ? sanitizeThemePresetKey(payload.key) : "";
  const allowOverwrite = Boolean(key && !RESERVED_THEME_PRESET_KEYS.has(key.toLowerCase()));
  const result = writeThemePresetFile({ key: allowOverwrite ? key : null, name, colors, allowOverwrite });
  return { presets: loadThemePresets(), selectedKey: result.key };
}

function deleteThemePreset(key) {
  const safeKey = sanitizeThemePresetKey(key);
  if (!safeKey || RESERVED_THEME_PRESET_KEYS.has(safeKey.toLowerCase())) {
    return { presets: loadThemePresets() };
  }
  const targetPath = path.join(THEME_PRESETS_DIR, `${safeKey}.json`);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
  }
  return { presets: loadThemePresets() };
}

async function importThemePreset() {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Import Theme",
    filters: [{ name: "Theme JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePaths.length) {
    return { ok: false, cancelled: true };
  }
  const filePath = result.filePaths[0];
  let raw = null;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return { ok: false, error: { code: "FILE_INVALID" } };
  }
  let colors = null;
  if (raw?.colors && typeof raw.colors === "object") {
    colors = raw.colors;
  } else if (raw && typeof raw === "object") {
    colors = raw;
  }
  if (!colors || typeof colors !== "object") {
    return { ok: false, error: { code: "FILE_INVALID" } };
  }
  const fallbackName = path.basename(filePath, ".json");
  const name = typeof raw?.name === "string" && raw.name.trim()
    ? raw.name.trim()
    : fallbackName || "Theme";
  const saved = saveThemePreset({ name, colors });
  return { ok: true, presets: saved.presets, selectedKey: saved.selectedKey };
}

async function exportThemePreset(payload) {
  if (!mainWindow) {
    return { ok: false, error: { code: "NO_WINDOW" } };
  }
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const colors = payload?.colors && typeof payload.colors === "object" ? payload.colors : null;
  if (!colors) {
    return { ok: false, error: { code: "THEME_INVALID" } };
  }
  const defaultName = sanitizeThemePresetKey(name) || "theme";
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export Theme",
    defaultPath: `${defaultName}.json`,
    filters: [{ name: "Theme JSON", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, cancelled: true };
  }
  const filePath = result.filePath.toLowerCase().endsWith(".json")
    ? result.filePath
    : `${result.filePath}.json`;
  const payloadData = { name: name || defaultName, colors };
  fs.writeFileSync(filePath, JSON.stringify(payloadData, null, 2));
  return { ok: true };
}

function migrateThemeStorePresets(rawStore) {
  const presets = rawStore?.presets && typeof rawStore.presets === "object" ? rawStore.presets : null;
  if (!presets || !Object.keys(presets).length) {
    return;
  }
  ensureThemePresetDir();
  let selected = themeStore.selectedPreset;
  Object.entries(presets).forEach(([name, colors]) => {
    if (!name || typeof colors !== "object") {
      return;
    }
    const result = writeThemePresetFile({
      key: name,
      name,
      colors,
      allowOverwrite: false
    });
    if (selected && selected.toLowerCase() === name.toLowerCase()) {
      selected = result.key;
    }
  });
  themeStore.selectedPreset = selected || themeStore.selectedPreset;
  saveThemeStore(themeStore);
}

function saveSettings(nextSettings) {
  settings = normalizeSettings(nextSettings);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  resetClient();
  return settings;
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

function normalizeProfiles(raw) {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const output = {};
  Object.entries(raw).forEach(([groupId, groupData]) => {
    if (!groupData || typeof groupData !== "object") {
      return;
    }
    output[groupId] = {
      groupName: groupData.groupName || "Unknown Group",
      profiles: groupData.profiles || {}
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: "#0f1416",
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: IS_DEV
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

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

async function findConflictingEvent(groupId, startsAtUtc) {
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
  const startUtc = DateTime.fromISO(startsAtUtc);
  const match = results.find(event => {
    const startValue = getEventStartValue(event);
    const eventStart = parseEventDateValue(startValue);
    if (!eventStart || !eventStart.isValid) {
      return false;
    }
    return Math.abs(eventStart.diff(startUtc, "seconds").seconds) < 60;
  });
  if (!match) {
    return null;
  }
  return {
    id: match.id,
    title: match.title
  };
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
    const updateAvailable = latestVersion && latestVersion !== APP_VERSION;
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

ipcMain.handle("app:installUpdate", () => {
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

ipcMain.handle("theme:get", () => themeStore);

ipcMain.handle("theme:set", (_, payload) => {
  return saveThemeStore(payload);
});

ipcMain.handle("themePresets:get", () => {
  return { presets: loadThemePresets() };
});

ipcMain.handle("themePresets:save", (_, payload) => {
  return saveThemePreset(payload);
});

ipcMain.handle("themePresets:delete", (_, key) => {
  return deleteThemePreset(key);
});

ipcMain.handle("themePresets:import", async () => {
  return importThemePreset();
});

ipcMain.handle("themePresets:export", async (_, payload) => {
  return exportThemePreset(payload);
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
  return enriched;
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
  const { groupId, groupName, profileKey, data } = payload || {};
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
  profiles[groupId].profiles[profileKey] = data;
  saveProfiles(profiles);
  return profiles;
});

ipcMain.handle("profiles:update", async (_, payload) => {
  const { groupId, groupName, profileKey, data } = payload || {};
  if (!groupId || !profileKey || !data) {
    throw new Error("Invalid profile payload.");
  }
  if (!profiles[groupId]) {
    profiles[groupId] = { groupName: groupName || "Unknown Group", profiles: {} };
  }
  profiles[groupId].groupName = groupName || profiles[groupId].groupName;
  profiles[groupId].profiles[profileKey] = data;
  saveProfiles(profiles);
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
    const { groupId, startsAtUtc, endsAtUtc, eventData } = payload || {};
    if (!groupId || !startsAtUtc || !endsAtUtc || !eventData) {
      throw new Error("Missing event data.");
    }
    await ensureCalendarPermission(groupId);
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
      featured: false,
      isDraft: false,
      parentId: null,
      roleIds: Array.isArray(eventData.roleIds) ? eventData.roleIds : []
    };
    debugApiCall("createGroupCalendarEvent", { groupId, body: requestBody });
    const response = await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
      body: requestBody
    });
    debugApiResponse("createGroupCalendarEvent", response);
    const eventId = getEventId(response.data);
    return { ok: true, eventId };
  } catch (err) {
    debugApiResponse("createGroupCalendarEvent", null, err);
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
  const now = DateTime.utc();
  const mapped = results
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
          timezone: getEventField(event, "timezone") || null
      };
    })
    .sort((a, b) => {
      const aTime = Date.parse(a.startsAtUtc || a.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      const bTime = Date.parse(b.startsAtUtc || b.endsAtUtc || "") || Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
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
      featured: false,
      isDraft: false,
      parentId: null,
      ...(Array.isArray(eventData.roleIds) ? { roleIds: eventData.roleIds } : {})
    };
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
  return files.map(file => {
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

app.whenReady().then(() => {
  initDebugLog();
  initializePaths();
  maybeImportProfiles();
  profiles = loadProfiles();
  createWindow();
  if (IS_DEV && DEBUG_LOG_PATH) {
    console.log(`\n📄 Debug log file: ${DEBUG_LOG_PATH}\n`);
  }

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

app.on("will-quit", () => {
  finalizeDebugLog();
});

