const { app, BrowserWindow, ipcMain, shell, dialog, nativeImage } = require("electron");

const path = require("path");
const fs = require("fs");
const https = require("https");
const { DateTime } = require("luxon");
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { generateDateOptionsFromPatterns, safeZone } = require("./core/date-utils");

// Disable GPU cache to suppress warnings
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

const APP_NAME = "VRChat Event Creator";
const IS_DEV = !app.isPackaged;
const APP_VERSION = (() => {
  try {
    const pkgPath = path.join(__dirname, "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg?.version) {
      return String(pkg.version);
    }
  } catch (err) {
    // Fall back to a safe default if package.json is unavailable.
  }
  return "0.0.0";
})();
const UPDATE_REPO_OWNER = "Cynacedia";
const UPDATE_REPO_NAME = "VRC-Event-Creator";
const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;
const UPDATE_CHECK_URLS = [
  `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/main/package.json`,
  `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/master/package.json`
];

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

function loadThemeStore() {
  return normalizeThemeStore(loadThemeStoreRaw());
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

function seedThemePresets() {
  if (!THEME_PRESETS_DIR || !THEME_PRESETS_BUNDLED_DIR) {
    return;
  }
  try {
    if (fs.existsSync(THEME_PRESETS_SEED_PATH)) {
      return;
    }
  } catch (err) {
    // Ignore seed checks.
  }
  if (!fs.existsSync(THEME_PRESETS_BUNDLED_DIR)) {
    return;
  }
  ensureThemePresetDir();
  const bundled = fs.readdirSync(THEME_PRESETS_BUNDLED_DIR)
    .filter(file => file.toLowerCase().endsWith(".json"));
  bundled.forEach(file => {
    const source = path.join(THEME_PRESETS_BUNDLED_DIR, file);
    const target = path.join(THEME_PRESETS_DIR, file);
    if (fs.existsSync(target)) {
      return;
    }
    try {
      fs.copyFileSync(source, target);
    } catch (err) {
      // Ignore copy errors.
    }
  });
  try {
    fs.writeFileSync(THEME_PRESETS_SEED_PATH, "seeded");
  } catch (err) {
    // Ignore seed write errors.
  }
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
  try {
    const res = await vrchat.getCurrentUser();
    if (typeof res.data === "string" || res.data?.error) {
      return null;
    }
    currentUser = res.data;
    return currentUser;
  } catch (err) {
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
  const loginRes = await vrchat.login({
    username,
    password,
    twoFactorCode: async () => {
      const code = await requestTwoFactorCode();
      twoFactorRequest = null;
      return code;
    },
    throwOnError: true
  });
  currentUser = loginRes.data;
  return currentUser;
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

function parseVersionParts(value) {
  return String(value || "")
    .trim()
    .replace(/^v/i, "")
    .split(/[\.\-+]/)
    .map(part => Number.parseInt(part, 10))
    .filter(part => Number.isFinite(part));
}

function isNewerVersion(current, latest) {
  const currentParts = parseVersionParts(current);
  const latestParts = parseVersionParts(latest);
  if (!latestParts.length) {
    return false;
  }
  if (!currentParts.length) {
    return true;
  }
  const maxLength = Math.max(currentParts.length, latestParts.length);
  for (let i = 0; i < maxLength; i += 1) {
    const currentValue = currentParts[i] || 0;
    const latestValue = latestParts[i] || 0;
    if (latestValue > currentValue) {
      return true;
    }
    if (latestValue < currentValue) {
      return false;
    }
  }
  return false;
}

function fetchJson(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { "User-Agent": `${APP_NAME}/${APP_VERSION}` }
    }, res => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location && redirectCount < 5) {
        res.resume();
        resolve(fetchJson(res.headers.location, redirectCount + 1));
        return;
      }
      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(`Update check failed with status ${status}.`));
        return;
      }
      let data = "";
      res.on("data", chunk => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on("error", reject);
    request.setTimeout(10000, () => {
      request.destroy(new Error("Update check timed out."));
    });
  });
}

async function fetchLatestVersion() {
  for (const url of UPDATE_CHECK_URLS) {
    try {
      const data = await fetchJson(url);
      if (data?.version) {
        return String(data.version);
      }
    } catch (err) {
      // Try the next URL.
    }
  }
  return null;
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
  const currentEvents = await vrchat.getGroupCalendarEvents({
    path: { groupId },
    query: { n: 100 }
  });
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
  const currentEvents = await vrchat.getGroupCalendarEvents({
    path: { groupId },
    query: { n: 100 }
  });
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

async function ensureCalendarPermission(groupId) {
  let permissions = groupPermissionCache.get(groupId);
  if (!permissions) {
    try {
      const res = await vrchat.getGroup({ path: { groupId } });
      permissions = res.data?.myMember?.permissions || [];
    } catch (err) {
      permissions = [];
    }
    groupPermissionCache.set(groupId, permissions);
  }
  const allowed =
    permissions.includes("*") || permissions.includes("group-calendar-manage");
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
    const latestVersion = await fetchLatestVersion();
    return {
      updateAvailable: latestVersion ? isNewerVersion(APP_VERSION, latestVersion) : false,
      currentVersion: APP_VERSION,
      latestVersion: latestVersion || null,
      repoUrl: UPDATE_REPO_URL
    };
  } catch (err) {
    return {
      updateAvailable: false,
      currentVersion: APP_VERSION,
      latestVersion: null,
      repoUrl: UPDATE_REPO_URL
    };
  }
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
  const user = await ensureUser();
  const groupsResponse = await vrchat.getUserGroups({ path: { userId: user.id } });
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
        const groupRes = await vrchat.getGroup({ path: { groupId } });
        permissions = groupRes.data?.myMember?.permissions || [];
        privacy = groupRes.data?.privacy;
      } catch (err) {
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
    const response = await vrchat.getGroupRoles({ path: { groupId } });
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
    await vrchat.createGroupCalendarEvent({
      throwOnError: true,
      path: { groupId },
        body: {
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
        }
      });
      return { ok: true };
    } catch (err) {
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
  const { groupId, upcomingOnly = true } = payload || {};
  if (!groupId) {
    throw new Error("Missing group.");
  }
  await ensureUser();
  await ensureCalendarPermission(groupId);
  const response = await vrchat.getGroupCalendarEvents({
    path: { groupId },
    query: { n: 100 }
  });
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
      if (editableFlag === false) {
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
        const startsAt = parseEventDateValue(startValue);
        const endsAt = parseEventDateValue(endValue);
        const startsAtUtc = startsAt?.isValid ? startsAt.toUTC().toISO() : null;
        const endsAtUtc = endsAt?.isValid ? endsAt.toUTC().toISO() : null;
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
    await vrchat.updateGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId: eventId },
        body: {
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
        }
      });
      return { ok: true };
    } catch (err) {
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
    await vrchat.deleteGroupCalendarEvent({
      throwOnError: true,
      path: { groupId, calendarId: eventId }
    });
    return { ok: true };
  } catch (err) {
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
  const res = await vrchat.getFiles({
    query: {
      tag: "gallery",
      n: limit,
      offset
    }
  });
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

    const limitCheck = await vrchat.getFiles({
      query: {
        tag: "gallery",
        n: 64,
        offset: 0
      }
    });
    const existingFiles = Array.isArray(limitCheck.data) ? limitCheck.data : [];
    if (existingFiles.length >= 64) {
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
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return { ok: false, error: { code: "FILE_INVALID" } };
    }

    const maxBytes = 10 * 1024 * 1024;
    if (stats.size >= maxBytes) {
      return { ok: false, error: { code: "FILE_TOO_LARGE" } };
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : (ext === ".jpg" || ext === ".jpeg") ? "image/jpeg" : "";
    if (!mimeType) {
      return { ok: false, error: { code: "FILE_TYPE" } };
    }

    const image = nativeImage.createFromPath(filePath);
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

    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const uploadFile = typeof File === "function"
      ? new File([buffer], fileName, { type: mimeType })
      : new Blob([buffer], { type: mimeType });
    const res = await vrchat.uploadGalleryImage({
      body: { file: uploadFile },
      throwOnError: true
    });

    return { ok: true, data: res?.data || null };
  } catch (err) {
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
  initializePaths();
  maybeImportProfiles();
  profiles = loadProfiles();
  createWindow();

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

