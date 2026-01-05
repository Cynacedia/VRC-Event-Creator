// ============================================================================
// Theme Configuration
// ============================================================================

const THEME_FIELDS = [
  { key: "accent", label: "Accent" },
  { key: "bg", label: "Background 1" },
  { key: "bgDeep", label: "Background 2" },
  { key: "backdrop", label: "Background 3" },
  { key: "panel", label: "Panel" },
  { key: "panelAlt", label: "Panel Alt" },
  { key: "headerBg", label: "Header" },
  { key: "overlay", label: "Overlay" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Text Muted" },
  { key: "link", label: "Link" },
  { key: "linkHover", label: "Link Hover" },
  { key: "button", label: "Button 1" },
  { key: "button2", label: "Button 2" },
  { key: "buttonText", label: "Button Text" },
  { key: "border", label: "Border" },
  { key: "shadow", label: "Shadow" },
  { key: "inputBg", label: "Input Background" },
  { key: "inputBgStrong", label: "Input Background 2" },
  { key: "inputText", label: "Input Text" },
  { key: "selectOptionBg", label: "Select Option" },
  { key: "selectOptionHighlight", label: "Select Highlight" },
  { key: "backdropOverlay", label: "Backdrop Glow" },
  { key: "backdropGrid", label: "Backdrop Grid" },
  { key: "scanline", label: "Scanline" }
];

const THEME_PRESET_LABELS = {
  wired: "『ᵂᶤʳᵉᵈ ᶠʳᵃᵐᵉ』",
  default: "VRChat Teal",
  teal: "Foggy Sea",
  purple: "Purple Haze",
  amber: "Altimit Amber",
  red: "Crimson Knights"
};

const BASE_THEME = {
  accent: "#1fc3ad",
  bg: "#cfd7d1",
  bgDeep: "#9aa7a2",
  backdrop: "#8c9f9a",
  panel: "#12181a",
  panelAlt: "#182022",
  headerBg: "#0c1012",
  overlay: "#080c0e",
  text: "#e8f0ec",
  textMuted: "#b8c6c0",
  link: "#1fc3ad",
  linkHover: "#4f96f2ff",
  button: "#4fc4f2ff",
  button2: "#1fc3ad",
  buttonText: "#12181a",
  border: "#eef6f2",
  shadow: "#090c0e",
  inputBg: "#060a0b",
  inputBgStrong: "#060a0b",
  inputText: "#f7fdf9",
  selectOptionBg: "#0f1416",
  selectOptionHighlight: "#1fc3ad",
  backdropOverlay: "#12181a",
  backdropGrid: "#ffffff",
  scanline: "#000000"
};

const THEMES = {
  default: {
    ...BASE_THEME,
    accent: "#65D9EE",
    bg: "#040404",
    bgDeep: "#040404",
    backdrop: "#0E1013",
    panel: "#07242B",
    panelAlt: "#07142B",
    headerBg: "#07242B",
    overlay: "#080C0E",
    text: "#E8F0F4",
    textMuted: "#B8C6C0",
    link: "#0E9BB1",
    linkHover: "#0D5D6A",
    button: "#07242B",
    button2: "#07142B",
    buttonText: "#65D9EE",
    border: "#053C48FF",
    shadow: "#090C0E",
    inputBg: "#060A0B",
    inputBgStrong: "#060A0B",
    inputText: "#F7FDF9",
    selectOptionBg: "#0F1416",
    selectOptionHighlight: "#050506",
    backdropOverlay: "#12181A",
    backdropGrid: "#1E2A31AA",
    scanline: "#000000"
  },
  teal: {
    ...BASE_THEME
  },
  purple: {
    ...BASE_THEME,
    accent: "#b47bf7",
    bg: "#e0d5f0",
    bgDeep: "#b5a3ca",
    backdrop: "#b5a3ca",
    panel: "#1e1824",
    panelAlt: "#241e2a",
    text: "#e8f0ec",
    link: "#b47bf7",
    linkHover: "#f74fd3ff",
    button: "#5e1368ff",
    button2: "#b47bf7",
    buttonText: "#1e1824",
    selectOptionHighlight: "#b47bf7"
  },
  amber: {
    ...BASE_THEME,
    accent: "#ff9f38",
    bg: "#1c1c1c",
    bgDeep: "#4f4f4f",
    backdrop: "#171717",
    panel: "#212121",
    panelAlt: "#725d40",
    headerBg: "#0c1012",
    overlay: "#080c0e",
    text: "#f1efe9",
    textMuted: "#c3c6b8",
    link: "#ffae57",
    linkHover: "#d1d1d1",
    button: "#f7a74f",
    button2: "#363636",
    buttonText: "#000000",
    border: "#ffffff",
    shadow: "#402d17",
    inputBg: "#060a0b",
    inputBgStrong: "#060a0b",
    inputText: "#fdfaf7",
    selectOptionBg: "#171717",
    selectOptionHighlight: "#f7a74f",
    backdropOverlay: "#000000",
    backdropGrid: "#000000",
    scanline: "#000000"
  },
  red: {
    ...BASE_THEME,
    accent: "#f74f6b",
    bg: "#f0d5db",
    bgDeep: "#c9a3ad",
    backdrop: "#c9a3ad",
    panel: "#24181a",
    panelAlt: "#2a1e20",
    text: "#e8f0ec",
    link: "#f74f6b",
    linkHover: "#adadad",
    button: "#949494",
    button2: "#f74f6b",
    buttonText: "#24181a",
    selectOptionHighlight: "#f74f6b"
  },
  wired: {
    ...BASE_THEME,
    accent: "#ffffff30",
    bg: "#000000",
    bgDeep: "#000000",
    backdrop: "#383838",
    panel: "#0f0f0fea",
    panelAlt: "#1c1c1c",
    headerBg: "#0a0a0a25",
    overlay: "#000000",
    text: "#e8f0ec",
    textMuted: "#b8c6c0",
    link: "#757575",
    linkHover: "#ffffff",
    button: "#0f0f0f",
    button2: "#292929",
    buttonText: "#ffffff",
    border: "#1c1c1cff",
    shadow: "#ffffff25",
    inputBg: "#000000",
    inputBgStrong: "#060606",
    inputText: "#f7fdf9",
    selectOptionBg: "#363636aa",
    selectOptionHighlight: "#141414",
    backdropOverlay: "#21212150",
    backdropGrid: "#00000045",
    scanline: "#7d7d7d99"
  }
};

// ============================================================================
// State Management
// ============================================================================

const THEME_KEYS = THEME_FIELDS.map(field => field.key);
const BUILTIN_PRESETS = ["wired", "default", "teal", "purple", "amber", "red"];
const RESERVED_PRESET_NAMES = new Set(["custom", "blue", ...BUILTIN_PRESETS.map(name => name.toLowerCase())]);

let themeStore = { selectedPreset: "default", customColors: null, presets: {} };
let themeControls = new Map();

// ============================================================================
// DOM References
// ============================================================================

const dom = {
  themeGrid: null,
  themePreset: null,
  presetName: null,
  savePreset: null,
  deletePreset: null,
  resetPreset: null,
  exportTheme: null,
  importTheme: null,
  fileInput: null,
  toastContainer: null
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  dom.themeGrid = document.getElementById('theme-color-grid');
  dom.themePreset = document.getElementById('theme-preset');
  dom.presetName = document.getElementById('preset-name');
  dom.savePreset = document.getElementById('save-preset');
  dom.deletePreset = document.getElementById('delete-preset');
  dom.resetPreset = document.getElementById('reset-preset');
  dom.exportTheme = document.getElementById('export-theme');
  dom.importTheme = document.getElementById('import-theme');
  dom.fileInput = document.getElementById('file-input');
  dom.toastContainer = document.getElementById('toast-container');

  // Initialize theme controls
  initThemeControls();

  // Load theme from localStorage
  loadTheme();

  // Bind event listeners
  dom.themePreset.addEventListener('change', handleThemeChange);
  dom.savePreset.addEventListener('click', handleThemePresetSave);
  dom.deletePreset.addEventListener('click', handleThemePresetDelete);
  dom.resetPreset.addEventListener('click', handleThemeReset);
  dom.exportTheme.addEventListener('click', handleExportTheme);
  dom.importTheme.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', handleImportTheme);
});

// ============================================================================
// Theme Control Initialization
// ============================================================================

function initThemeControls() {
  if (!dom.themeGrid) {
    return;
  }
  themeControls = new Map();
  dom.themeGrid.innerHTML = "";
  const defaults = normalizeThemeColors(THEMES.default);

  THEME_FIELDS.forEach(field => {
    const wrapper = document.createElement("div");
    wrapper.className = "theme-control";
    wrapper.dataset.themeKey = field.key;

    const label = document.createElement("label");
    label.textContent = field.label;
    label.setAttribute("for", `theme-${field.key}`);

    const row = document.createElement("div");
    row.className = "theme-control-row";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = `theme-${field.key}`;
    colorInput.value = defaults[field.key];

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "theme-hex";
    hexInput.value = defaults[field.key].toUpperCase();
    hexInput.placeholder = defaults[field.key].toUpperCase();
    hexInput.maxLength = 9;

    row.appendChild(colorInput);
    row.appendChild(hexInput);
    wrapper.appendChild(label);
    wrapper.appendChild(row);
    dom.themeGrid.appendChild(wrapper);

    themeControls.set(field.key, { colorInput, hexInput });
  });

  themeControls.forEach(({ colorInput, hexInput }) => {
    colorInput.addEventListener("input", () => {
      const alphaSuffix = getHexAlphaSuffix(hexInput.value);
      hexInput.value = `${colorInput.value.toUpperCase()}${alphaSuffix}`;
      handleCustomColorChange();
    });
    hexInput.addEventListener("input", () => {
      const value = hexInput.value.trim().toUpperCase();
      if (isValidHex(value)) {
        colorInput.value = getHexBase(value);
        hexInput.value = value;
        handleCustomColorChange();
      }
    });
  });
}

// ============================================================================
// Theme Application
// ============================================================================

function applyTheme(colors) {
  const root = document.documentElement;
  const normalized = normalizeThemeColors(colors);

  root.style.setProperty("--accent", normalized.accent);
  root.style.setProperty("--accent-contrast", normalized.accentContrast);
  root.style.setProperty("--bg", normalized.bg);
  root.style.setProperty("--bg-deep", normalized.bgDeep);
  root.style.setProperty("--backdrop", normalized.backdrop);
  root.style.setProperty("--panel", rgbaFromHex(normalized.panel, 0.92));
  root.style.setProperty("--panel-alt", rgbaFromHex(normalized.panelAlt, 0.9));
  root.style.setProperty("--header-bg", rgbaFromHex(normalized.headerBg, 0.62));
  root.style.setProperty("--overlay", rgbaFromHex(normalized.overlay, 0.7));
  root.style.setProperty("--text", normalized.text);
  root.style.setProperty("--text-muted", normalized.textMuted);
  root.style.setProperty("--link", normalized.link);
  root.style.setProperty("--link-hover", normalized.linkHover);
  root.style.setProperty("--button-1", normalized.button);
  root.style.setProperty("--button-2", normalized.button2);
  root.style.setProperty("--button-text", normalized.buttonText);

  root.style.setProperty("--accent-soft", rgbaFromHex(normalized.accent, 0.2));
  root.style.setProperty("--glow", `0 0 12px ${rgbaFromHex(normalized.accent, 0.4)}`);
  root.style.setProperty("--button-1-soft", rgbaFromHex(normalized.button, 0.08));
  root.style.setProperty("--button-2-soft", rgbaFromHex(normalized.button2, 0.08));
  root.style.setProperty("--border", rgbaFromHex(normalized.border, 0.15));
  root.style.setProperty("--border-strong", rgbaFromHex(normalized.border, 0.28));
  root.style.setProperty("--shadow", rgbaFromHex(normalized.shadow, 0.5));
  root.style.setProperty("--shadow-strong", rgbaFromHex(normalized.shadow, 0.35));
  root.style.setProperty("--text-shadow-strong", rgbaFromHex(normalized.shadow, 0.55));
  root.style.setProperty("--text-shadow-soft", rgbaFromHex(normalized.shadow, 0.45));
  root.style.setProperty("--text-shadow-softer", rgbaFromHex(normalized.shadow, 0.4));
  root.style.setProperty("--surface-glass", rgbaFromHex(normalized.text, 0.03));
  root.style.setProperty("--surface-glass-strong", rgbaFromHex(normalized.text, 0.05));
  root.style.setProperty("--surface-dim", rgbaFromHex(normalized.shadow, 0.05));
  root.style.setProperty("--surface-soft", rgbaFromHex(normalized.shadow, 0.2));
  root.style.setProperty("--surface-strong", rgbaFromHex(normalized.shadow, 0.25));
  root.style.setProperty("--input-bg", rgbaFromHex(normalized.inputBg, 0.6));
  root.style.setProperty("--input-bg-strong", rgbaFromHex(normalized.inputBgStrong, 0.85));
  root.style.setProperty("--input-text", normalized.inputText);
  root.style.setProperty("--select-option-bg", normalized.selectOptionBg);
  root.style.setProperty("--select-option-highlight", normalized.selectOptionHighlight);
  root.style.setProperty("--backdrop-overlay-strong", rgbaFromHex(normalized.backdropOverlay, 0.35));
  root.style.setProperty("--backdrop-overlay-soft", rgbaFromHex(normalized.backdropOverlay, 0.15));
  root.style.setProperty("--backdrop-grid", rgbaFromHex(normalized.backdropGrid, 0.06));
  root.style.setProperty("--backdrop-grid-strong", rgbaFromHex(normalized.backdropGrid, 0.08));
  root.style.setProperty("--scanline", rgbaFromHex(normalized.scanline, 0.12));
}

// ============================================================================
// Theme Loading & Saving
// ============================================================================

function loadTheme() {
  const stored = fetchThemeStore();
  themeStore = normalizeThemeStore(stored);

  const presetKey = resolvePresetKey(themeStore.selectedPreset);
  themeStore.selectedPreset = presetKey;
  const colors = getPresetColors(presetKey);
  refreshThemePresetOptions(presetKey);
  syncThemeControls(colors);
  applyTheme(colors);
  updatePresetActions(presetKey);
}

function saveTheme() {
  try {
    localStorage.setItem('themeStudio', JSON.stringify(themeStore));
  } catch (err) {
    showToast('Failed to save theme', true);
  }
}

function fetchThemeStore() {
  try {
    const stored = localStorage.getItem('themeStudio');
    return stored ? JSON.parse(stored) : {};
  } catch (err) {
    return {};
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

function handleThemeChange() {
  const presetKey = resolvePresetKey(dom.themePreset.value);
  const colors = getPresetColors(presetKey);
  themeStore.selectedPreset = presetKey;
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions(presetKey);
  saveTheme();
}

function handleCustomColorChange() {
  if (!themeControls.size) {
    return;
  }
  const colors = getThemeFromControls();
  themeStore.customColors = colors;
  themeStore.selectedPreset = "custom";
  dom.themePreset.value = "custom";
  applyTheme(colors);
  updatePresetActions("custom");
  saveTheme();
}

function handleThemeReset() {
  const current = dom.themePreset.value;
  const presetKey = current === "custom" ? "default" : resolvePresetKey(current);
  const colors = getPresetColors(presetKey);
  dom.themePreset.value = presetKey;
  themeStore.selectedPreset = presetKey;
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions(presetKey);
  saveTheme();
  showToast('Theme reset successfully');
}

function handleThemePresetSave() {
  const selectedKey = resolvePresetKey(dom.themePreset.value);
  const inputName = (dom.presetName?.value || "").trim();
  const isSelectedCustom = isCustomPreset(selectedKey);
  const isSelectedBuiltin = BUILTIN_PRESETS.includes(selectedKey);
  const selectedLabel = THEME_PRESET_LABELS[selectedKey] || selectedKey;
  const inputLower = inputName.toLowerCase();
  const matchesSelectedLabel = inputLower && inputLower === selectedLabel.toLowerCase();
  const matchesSelectedKey = inputLower && inputLower === selectedKey.toLowerCase();
  const colors = getThemeFromControls();

  let targetName = inputName;
  if (isSelectedCustom && (!targetName || targetName.toLowerCase() === selectedKey.toLowerCase())) {
    targetName = selectedKey;
  } else {
    if (!targetName || (isSelectedBuiltin && (matchesSelectedLabel || matchesSelectedKey))) {
      if (isSelectedBuiltin) {
        targetName = buildEditName(selectedLabel);
      } else {
        targetName = buildEditName("Custom");
      }
    } else if (RESERVED_PRESET_NAMES.has(targetName.toLowerCase())) {
      targetName = buildEditName(isSelectedBuiltin ? selectedLabel : targetName);
    } else if (isNameTaken(targetName, selectedKey)) {
      targetName = buildEditName(targetName);
    }
  }

  themeStore.presets[targetName] = colors;
  themeStore.selectedPreset = targetName;
  refreshThemePresetOptions(targetName);
  applyTheme(colors);
  updatePresetActions(targetName);
  saveTheme();
  showToast(`Theme saved: ${targetName}`);
}

function handleThemePresetDelete() {
  const selected = dom.themePreset.value;
  if (!isCustomPreset(selected)) {
    showToast("Select a custom theme to delete.", true);
    return;
  }
  const confirmed = window.confirm(`Delete the "${selected}" theme?`);
  if (!confirmed) {
    return;
  }
  delete themeStore.presets[selected];
  themeStore.selectedPreset = "default";
  const colors = getPresetColors("default");
  refreshThemePresetOptions("default");
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions("default");
  saveTheme();
  showToast("Theme deleted.");
}

function handleExportTheme() {
  const exportData = buildThemeExportPayload();
  const safeName = sanitizeFileName(exportData.name) || "theme";
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Theme exported for the app');
}

function handleImportTheme(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importData = JSON.parse(e.target.result);
      const fallbackName = file.name.replace(/\.json$/i, "") || "Imported Theme";
      if (importData?.themeStore) {
        const imported = normalizeThemeStore(importData.themeStore);
        let selected = null;
        Object.entries(imported.presets || {}).forEach(([name, colors]) => {
          const uniqueName = getUniquePresetName(name || fallbackName);
          themeStore.presets[uniqueName] = colors;
          if (imported.selectedPreset && name === imported.selectedPreset) {
            selected = uniqueName;
          }
        });
        if (selected) {
          themeStore.selectedPreset = selected;
          const colors = getPresetColors(selected);
          refreshThemePresetOptions(selected);
          applyTheme(colors);
          syncThemeControls(colors);
          updatePresetActions(selected);
        } else {
          refreshThemePresetOptions(themeStore.selectedPreset);
        }
        saveTheme();
        showToast("Themes imported successfully");
      } else {
        const payload = parseThemePayload(importData);
        if (!payload) {
          throw new Error("Invalid theme file");
        }
        const name = getUniquePresetName(payload.name || fallbackName);
        const colors = normalizeThemeColors(payload.colors);
        themeStore.presets[name] = colors;
        themeStore.selectedPreset = name;
        refreshThemePresetOptions(name);
        applyTheme(colors);
        syncThemeControls(colors);
        updatePresetActions(name);
        saveTheme();
        showToast(`Theme imported: ${name}`);
      }
    } catch (err) {
      showToast('Failed to import theme: ' + err.message, true);
    }
  };
  reader.readAsText(file);

  // Reset file input
  event.target.value = '';
}

// ============================================================================
// Helper Functions
// ============================================================================

function isValidHex(value) {
  return typeof value === "string" && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value.trim());
}

function sanitizeHex(value, fallback) {
  if (!isValidHex(value)) {
    return fallback.toUpperCase();
  }
  return value.trim().toUpperCase();
}

function getHexBase(value) {
  if (!isValidHex(value)) {
    return "#000000";
  }
  return value.trim().toUpperCase().slice(0, 7);
}

function getHexAlphaSuffix(value) {
  if (!isValidHex(value)) {
    return "";
  }
  const cleaned = value.trim().toUpperCase();
  return cleaned.length === 9 ? cleaned.slice(7) : "";
}

function normalizeThemeColors(raw) {
  const defaults = THEMES.default;
  const normalized = {};
  THEME_KEYS.forEach(key => {
    normalized[key] = sanitizeHex(raw?.[key], defaults[key]);
  });
  normalized.accentContrast = getContrastColor(normalized.accent);
  if (!isValidHex(raw?.bgDeep)) {
    normalized.bgDeep = adjustColor(normalized.bg, -20);
  }
  if (!isValidHex(raw?.panelAlt)) {
    normalized.panelAlt = adjustColor(normalized.panel, 6);
  }
  if (!isValidHex(raw?.link)) {
    normalized.link = normalized.accent;
  }
  if (!isValidHex(raw?.linkHover)) {
    normalized.linkHover = normalized.button || normalized.accent;
  }
  if (!isValidHex(raw?.button2)) {
    normalized.button2 = normalized.accent;
  }
  if (!isValidHex(raw?.buttonText)) {
    normalized.buttonText = normalized.panel;
  }
  if (!isValidHex(raw?.inputBgStrong)) {
    normalized.inputBgStrong = normalized.inputBg;
  }
  if (!isValidHex(raw?.selectOptionHighlight)) {
    normalized.selectOptionHighlight = normalized.accent;
  }
  if (!isValidHex(raw?.backdropOverlay)) {
    normalized.backdropOverlay = normalized.panel;
  }
  return normalized;
}

function normalizeThemeStore(raw) {
  let selectedPreset = typeof raw?.selectedPreset === "string" ? raw.selectedPreset : "default";
  if (selectedPreset === "blue") {
    selectedPreset = "default";
  }
  const presets = {};
  if (raw?.presets && typeof raw.presets === "object") {
    Object.entries(raw.presets).forEach(([name, colors]) => {
      if (!name || RESERVED_PRESET_NAMES.has(name.toLowerCase())) {
        return;
      }
      presets[name] = normalizeThemeColors(colors);
    });
  }
  const customColors = raw?.customColors ? normalizeThemeColors(raw.customColors) : null;
  return { selectedPreset, customColors, presets };
}

function resolvePresetKey(candidate) {
  if (candidate === "custom") {
    return "custom";
  }
  if (candidate === "blue") {
    return "default";
  }
  if (BUILTIN_PRESETS.includes(candidate)) {
    return candidate;
  }
  if (themeStore.presets && Object.prototype.hasOwnProperty.call(themeStore.presets, candidate)) {
    return candidate;
  }
  return "default";
}

function getPresetColors(key) {
  if (key === "custom") {
    return normalizeThemeColors(themeStore.customColors || THEMES.default);
  }
  if (BUILTIN_PRESETS.includes(key)) {
    return normalizeThemeColors(THEMES[key]);
  }
  if (themeStore.presets && themeStore.presets[key]) {
    return normalizeThemeColors(themeStore.presets[key]);
  }
  return normalizeThemeColors(THEMES.default);
}

function isCustomPreset(key) {
  return Boolean(themeStore.presets && Object.prototype.hasOwnProperty.call(themeStore.presets, key));
}

function refreshThemePresetOptions(selected) {
  if (!dom.themePreset) {
    return;
  }
  dom.themePreset.innerHTML = "";

  const presetGroup = document.createElement("optgroup");
  presetGroup.label = "Presets";
  BUILTIN_PRESETS.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = THEME_PRESET_LABELS[name] || name;
    presetGroup.appendChild(option);
  });
  dom.themePreset.appendChild(presetGroup);

  const customGroup = document.createElement("optgroup");
  customGroup.label = "Custom";
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = "Custom (unsaved)";
  customGroup.appendChild(customOption);
  Object.keys(themeStore.presets || {}).sort((a, b) => a.localeCompare(b)).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    customGroup.appendChild(option);
  });
  dom.themePreset.appendChild(customGroup);

  dom.themePreset.value = resolvePresetKey(selected);
}

function syncThemeControls(colors) {
  const normalized = normalizeThemeColors(colors);
  themeControls.forEach((controls, key) => {
    const value = normalized[key];
    controls.colorInput.value = getHexBase(value);
    controls.hexInput.value = value.toUpperCase();
    controls.hexInput.placeholder = value.toUpperCase();
  });
}

function getThemeFromControls() {
  const raw = {};
  themeControls.forEach((controls, key) => {
    const value = controls.hexInput.value.trim().toUpperCase();
    raw[key] = isValidHex(value) ? value : controls.colorInput.value.toUpperCase();
  });
  return normalizeThemeColors(raw);
}

function updatePresetActions(selected) {
  if (dom.deletePreset) {
    dom.deletePreset.disabled = !isCustomPreset(selected);
  }
  if (dom.presetName) {
    dom.presetName.value = isCustomPreset(selected) ? selected : "";
  }
}

function findCustomPresetKey(name) {
  const target = name.toLowerCase();
  return Object.keys(themeStore.presets || {}).find(key => key.toLowerCase() === target);
}

function isNameTaken(name, selectedKey) {
  const target = name.toLowerCase();
  if (BUILTIN_PRESETS.some(key => key.toLowerCase() === target)) {
    return true;
  }
  const existing = findCustomPresetKey(name);
  if (!existing) {
    return false;
  }
  if (selectedKey && existing.toLowerCase() === selectedKey.toLowerCase()) {
    return false;
  }
  return true;
}

function buildEditName(baseName) {
  const base = (baseName || "Custom").trim() || "Custom";
  let index = 1;
  let candidate = `${base} - Edit ${index}`;
  while (RESERVED_PRESET_NAMES.has(candidate.toLowerCase()) || isNameTaken(candidate)) {
    index += 1;
    candidate = `${base} - Edit ${index}`;
  }
  return candidate;
}

function resolveExportName(selected) {
  const inputName = (dom.presetName?.value || "").trim();
  if (inputName) {
    return inputName;
  }
  if (isCustomPreset(selected)) {
    return selected;
  }
  const presetLabel = THEME_PRESET_LABELS[selected];
  if (presetLabel) {
    return presetLabel;
  }
  if (selected && selected !== "custom") {
    return selected;
  }
  return "Custom Theme";
}

function buildThemeExportPayload() {
  const selected = resolvePresetKey(dom.themePreset.value);
  const colors = getThemeFromControls();
  const name = resolveExportName(selected);
  return { name, colors };
}

function sanitizeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim();
}

function getUniquePresetName(name) {
  let candidate = (name || "").trim() || "Imported Theme";
  if (RESERVED_PRESET_NAMES.has(candidate.toLowerCase()) || isNameTaken(candidate)) {
    candidate = buildEditName(candidate);
  }
  return candidate;
}

function parseThemePayload(raw) {
  if (raw?.colors && typeof raw.colors === "object") {
    return { name: raw.name, colors: raw.colors };
  }
  if (raw && typeof raw === "object" && THEME_KEYS.some(key => Object.prototype.hasOwnProperty.call(raw, key))) {
    return { name: raw.name, colors: raw };
  }
  return null;
}

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6 && cleaned.length !== 8) {
    return null;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const a = cleaned.length === 8 ? parseInt(cleaned.slice(6, 8), 16) / 255 : null;
  return { r, g, b, a };
}

function rgbaFromHex(hex, alpha) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const finalAlpha = typeof rgb.a === "number" ? rgb.a : alpha;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha})`;
}

function adjustColor(hex, percent) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const num = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  const alphaSuffix = typeof rgb.a === "number"
    ? Math.round(rgb.a * 255).toString(16).padStart(2, "0")
    : "";
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}${alphaSuffix}`;
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return "#000000";
  }
  const channels = [rgb.r, rgb.g, rgb.b].map(value => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.55 ? "#000000" : "#FFFFFF";
}

// ============================================================================
// Toast Notifications
// ============================================================================

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' is-error' : ''}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
