/**
 * Theme store module.
 * Manages theme preferences, preset files, import/export, and migration.
 */

const fs = require("fs");
const path = require("path");

let THEMES_PATH, THEME_PRESETS_DIR, THEME_PRESETS_SEED_PATH, THEME_PRESETS_BUNDLED_DIR;
let getMainWindow;
let dialog;

let themeStore;

const RESERVED_THEME_PRESET_KEYS = new Set(["default", "wired", "custom", "blue"]);

function init(config) {
  THEMES_PATH = config.themesPath;
  THEME_PRESETS_DIR = config.presetsDir;
  THEME_PRESETS_SEED_PATH = config.seedPath;
  THEME_PRESETS_BUNDLED_DIR = config.bundledDir;
  getMainWindow = config.getMainWindow;
  dialog = config.dialog;
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

function getThemeStore() {
  return themeStore;
}

function setThemeStore(value) {
  themeStore = value;
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
  const mainWindow = getMainWindow();
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
  const mainWindow = getMainWindow();
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

module.exports = {
  init,
  getThemeStore,
  setThemeStore,
  loadThemeStoreRaw,
  normalizeThemeStore,
  saveThemeStore,
  sanitizeThemePresetKey,
  ensureThemePresetDir,
  loadSeededThemeKeys,
  saveSeededThemeKeys,
  seedThemePresets,
  readThemePresetFile,
  loadThemePresets,
  writeThemePresetFile,
  saveThemePreset,
  deleteThemePreset,
  importThemePreset,
  exportThemePreset,
  migrateThemeStorePresets,
  RESERVED_THEME_PRESET_KEYS
};
