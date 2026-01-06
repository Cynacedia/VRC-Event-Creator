// UI helper functions for VRChat Event Creator

import { dom, state } from "./state.js";
import { THEMES, THEME_FIELDS, THEME_PRESET_LABELS } from "./config.js";
import { t } from "./i18n/index.js";

let statusIsAuthed = false;
let updateAvailable = false;
let updateDownloaded = false;
let updateDownloading = false;
let updateProgress = 0;

function updateStatusPill() {
  if (!dom.statusPill) {
    return;
  }
  const isResyncHover = dom.statusPill.dataset.hover === "resync";
  if (updateAvailable) {
    if (dom.statusPill.dataset.hover) {
      delete dom.statusPill.dataset.hover;
    }
    if (updateDownloaded) {
      dom.statusPill.textContent = t("common.updateReady");
      dom.statusPill.style.setProperty("--update-progress", "100%");
    } else if (updateDownloading) {
      dom.statusPill.textContent = `${t("common.updating")} ${updateProgress}%`;
      dom.statusPill.style.setProperty("--update-progress", `${updateProgress}%`);
    } else {
      dom.statusPill.textContent = t("common.update");
      dom.statusPill.style.setProperty("--update-progress", "0%");
    }
    dom.statusPill.classList.add("is-update");
    dom.statusPill.classList.toggle("is-downloading", updateDownloading);
    dom.statusPill.classList.toggle("is-downloaded", updateDownloaded);
    dom.statusPill.classList.remove("is-online");
    dom.statusPill.disabled = false;
    dom.statusPill.setAttribute("aria-disabled", "false");
  } else {
    if (!statusIsAuthed && dom.statusPill.dataset.hover) {
      delete dom.statusPill.dataset.hover;
    }
    if (statusIsAuthed && !isResyncHover) {
      dom.statusPill.textContent = t("common.online");
    } else if (!statusIsAuthed) {
      dom.statusPill.textContent = t("common.offline");
    }
    dom.statusPill.classList.remove("is-update", "is-downloading", "is-downloaded");
    dom.statusPill.classList.toggle("is-online", statusIsAuthed);
    dom.statusPill.style.setProperty("--update-progress", "0%");
    dom.statusPill.disabled = !statusIsAuthed;
    dom.statusPill.setAttribute("aria-disabled", statusIsAuthed ? "false" : "true");
  }
}

export function setUpdateAvailable(isAvailable, isDownloaded = false) {
  updateAvailable = Boolean(isAvailable);
  updateDownloaded = Boolean(isDownloaded);
  updateStatusPill();
}

export function setUpdateProgress(percent, isDownloading = true) {
  updateDownloading = Boolean(isDownloading);
  updateProgress = Math.round(percent || 0);
  updateStatusPill();
}

export function refreshStatusPill() {
  updateStatusPill();
}

// ============================================================================
// Status and Toast
// ============================================================================

export function setStatus(message) {
  dom.statusLine.textContent = message;
}

export function setFootMeta(message) {
  const normalized = (message || "").trim().toLowerCase();
  const readyLabel = t("common.ready").trim().toLowerCase();
  if (!normalized || normalized === readyLabel) {
    dom.footMeta.textContent = "";
    return;
  }
  dom.footMeta.textContent = message;
}

export function showToast(message, isError = false, options = {}) {
  let duration = 3000;
  if (typeof options === "number") {
    duration = options;
  } else if (options && typeof options.duration === "number") {
    duration = options.duration;
  }
  dom.toast.textContent = message;
  dom.toast.classList.remove("is-hidden");
  dom.toast.classList.toggle("is-error", isError);
  window.clearTimeout(dom.toast._timer);
  dom.toast._timer = window.setTimeout(() => {
    dom.toast.classList.add("is-hidden");
  }, duration);
}

// ============================================================================
// Auth State
// ============================================================================

export function setAuthState(isAuthed) {
  statusIsAuthed = Boolean(isAuthed);
  updateStatusPill();
  dom.logoutBtn.disabled = !isAuthed;
  dom.loginOverlay.classList.toggle("is-hidden", isAuthed);
  dom.navButtons.forEach(btn => {
    if (btn.dataset.view !== "about") {
      btn.disabled = !isAuthed;
    }
  });
  dom.eventCreate.disabled = !isAuthed
    || state.event.createBlocked
    || state.event.createInProgress
    || state.app?.updateAvailable;
  if (dom.eventCountRefresh) {
    dom.eventCountRefresh.disabled = !isAuthed || !dom.eventGroup?.value;
  }
}

// ============================================================================
// Views
// ============================================================================

export function showView(viewName) {
  dom.navButtons.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.view === viewName);
  });
  dom.viewCreate.classList.toggle("is-hidden", viewName !== "create");
  dom.viewModify.classList.toggle("is-hidden", viewName !== "modify");
  dom.viewProfiles.classList.toggle("is-hidden", viewName !== "profiles");
  dom.viewAbout.classList.toggle("is-hidden", viewName !== "about");
}

// ============================================================================
// Rendering Functions
// ============================================================================

function resolveItemLabel(item, getLabel) {
  if (!item) {
    return "";
  }
  if (typeof getLabel === "function") {
    return getLabel(item) || item.label || "";
  }
  if (item.labelKey) {
    return t(item.labelKey);
  }
  return item.label || "";
}

export function renderSelect(selectEl, items, placeholder, getLabel) {
  selectEl.innerHTML = "";
  if (placeholder) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = placeholder;
    selectEl.appendChild(option);
  }
  items.forEach(item => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = resolveItemLabel(item, getLabel);
    selectEl.appendChild(option);
  });
}

export function renderChecklist(container, items, selected, options = {}) {
  const { max, filterText, onChange, getLabel } = options;
  container.innerHTML = "";
  const lowerFilter = (filterText || "").toLowerCase();
  const resolved = items.map(item => ({
    item,
    label: resolveItemLabel(item, getLabel)
  }));
  const filtered = resolved.filter(entry =>
    entry.label.toLowerCase().includes(lowerFilter)
  );
  const hasLimit = typeof max === "number";
  filtered.forEach(entry => {
    const item = entry.item;
    const labelText = entry.label;
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = item.value;
    input.checked = selected.includes(item.value);
    const limitReached = hasLimit && !input.checked && selected.length >= max;
    input.disabled = limitReached;
    input.addEventListener("change", () => {
      const next = selected.slice();
      if (input.checked) {
        if (!next.includes(item.value)) {
          next.push(item.value);
        }
      } else {
        const idx = next.indexOf(item.value);
        if (idx >= 0) {
          next.splice(idx, 1);
        }
      }
      onChange(next);
    });
    const text = document.createElement("span");
    text.textContent = labelText;
    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  });
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = t("common.noMatches");
    container.appendChild(empty);
  }
}

// ============================================================================
// Wizard
// ============================================================================

export function setupWizard({ wizardId, stepsId, backButton, nextButton, beforeStepChange }) {
  const wizard = document.getElementById(wizardId);
  if (!wizard) {
    return null;
  }
  const stepPanels = Array.from(wizard.querySelectorAll(".wizard-step"));
  const stepButtons = Array.from(document.querySelectorAll(`#${stepsId} .wizard-stepper`));
  if (!stepPanels.length || !stepButtons.length) {
    return null;
  }
  let current = 0;
  const update = () => {
    stepPanels.forEach((panel, index) => {
      panel.classList.toggle("is-hidden", index !== current);
    });
    stepButtons.forEach((button, index) => {
      button.classList.toggle("is-active", index === current);
      button.classList.toggle("is-complete", index < current);
      button.setAttribute("aria-current", index === current ? "step" : "false");
    });
    if (backButton) {
      backButton.disabled = current === 0;
    }
    if (nextButton) {
      const isLast = current >= stepPanels.length - 1;
      nextButton.disabled = isLast;
      nextButton.classList.toggle("is-hidden", isLast);
    }
  };
  const goTo = index => {
    if (index < 0 || index >= stepPanels.length) {
      return;
    }
    if (typeof beforeStepChange === "function") {
      const canAdvance = beforeStepChange({ current, next: index });
      if (!canAdvance) {
        return;
      }
    }
    current = index;
    update();
  };
  stepButtons.forEach((button, index) => {
    button.addEventListener("click", () => goTo(index));
  });
  if (backButton) {
    backButton.addEventListener("click", () => goTo(current - 1));
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => goTo(current + 1));
  }
  update();
  return { goTo };
}

// ============================================================================
// Window Controls
// ============================================================================

export function bindWindowControls(windowControls) {
  if (!windowControls || !dom.windowMinimize || !dom.windowMaximize || !dom.windowClose) {
    return;
  }
  const updateMaximizeState = isMaximized => {
    dom.windowMaximize.textContent = isMaximized ? "[ ]" : "[]";
    dom.windowMaximize.classList.toggle("is-maximized", isMaximized);
  };
  dom.windowMinimize.addEventListener("click", () => {
    windowControls.minimize();
  });
  dom.windowMaximize.addEventListener("click", () => {
    windowControls.maximize();
  });
  dom.windowClose.addEventListener("click", () => {
    windowControls.close();
  });
  if (dom.titlebar) {
    dom.titlebar.addEventListener("dblclick", () => {
      windowControls.maximize();
    });
  }
  if (typeof windowControls.onMaximizeChange === "function") {
    windowControls.onMaximizeChange(isMax => updateMaximizeState(isMax));
  }
  windowControls.isMaximized().then(isMax => updateMaximizeState(isMax));
}

// ============================================================================
// Theme Management
// ============================================================================

const THEME_KEYS = THEME_FIELDS.map(field => field.key);
const BUILTIN_PRESETS = [
  "wired",
  "default"
].filter(name => Object.prototype.hasOwnProperty.call(THEMES, name));
const RESERVED_PRESET_KEYS = new Set([
  "custom",
  "blue",
  ...BUILTIN_PRESETS.map(name => name.toLowerCase())
]);

let themeStore = { selectedPreset: "default", customColors: null };
let themeFilePresets = {};
let themeControls = new Map();
let themeApi = null;

export function initThemeControls() {
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
    const labelText = field.labelKey ? t(field.labelKey) : field.label;
    label.textContent = labelText;
    if (field.labelKey) {
      label.setAttribute("data-i18n", field.labelKey);
    }
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

export function applyTheme(colors) {
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
  const panelBase = getHexBase(normalized.panel);
  const accentBase = getHexBase(normalized.accent);
  const contrastRatio = getContrastRatio(accentBase, panelBase);
  const fallbackUpdateBg = "#FF6B35";
  const fallbackRestartBg = "#22C55E";
  const updateBg = contrastRatio >= 4.5 ? accentBase : fallbackUpdateBg;
  const updateText = getLuminance(updateBg) > 0.5 ? "#000000" : "#FFFFFF";
  root.style.setProperty("--update-pill-bg", updateBg);
  root.style.setProperty("--update-pill-text", updateText);
  root.style.setProperty("--restart-pill-bg", fallbackRestartBg);
  root.style.setProperty("--restart-pill-text", "#FFFFFF");

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

export async function loadTheme(api) {
  if (api) {
    themeApi = api;
  }
  const stored = await fetchThemeStore();
  themeStore = normalizeThemeStore(stored);
  const migrated = migrateLegacyTheme(themeStore);
  if (migrated) {
    await saveThemeStore();
  }
  const presets = await fetchThemePresets();
  setThemeFilePresets(presets);

  const presetKey = resolvePresetKey(themeStore.selectedPreset);
  themeStore.selectedPreset = presetKey;
  const colors = getPresetColors(presetKey);
  refreshThemePresetOptions(presetKey);
  syncThemeControls(colors);
  applyTheme(colors);
  updatePresetActions(presetKey);
}

export function handleThemeChange() {
  const presetKey = resolvePresetKey(dom.settingsTheme.value);
  const colors = getPresetColors(presetKey);
  themeStore.selectedPreset = presetKey;
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions(presetKey);
  void saveThemeStore();
}

export function handleCustomColorChange() {
  if (!themeControls.size) {
    return;
  }
  const colors = getThemeFromControls();
  themeStore.customColors = colors;
  themeStore.selectedPreset = "custom";
  dom.settingsTheme.value = "custom";
  applyTheme(colors);
  updatePresetActions("custom");
  void saveThemeStore();
}

export function handleThemeReset() {
  const current = dom.settingsTheme.value;
  const presetKey = current === "custom" ? "default" : resolvePresetKey(current);
  const colors = getPresetColors(presetKey);
  dom.settingsTheme.value = presetKey;
  themeStore.selectedPreset = presetKey;
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions(presetKey);
  void saveThemeStore();
}

export async function handleThemePresetSave() {
  const selectedKey = resolvePresetKey(dom.settingsTheme.value);
  const inputName = (dom.themePresetName?.value || "").trim();
  const isSelectedFile = isFilePreset(selectedKey);
  const isSelectedBuiltin = BUILTIN_PRESETS.includes(selectedKey);
  const selectedLabel = getPresetLabel(selectedKey) || selectedKey;
  const inputLower = inputName.toLowerCase();
  const matchesSelectedLabel = inputLower && inputLower === selectedLabel.toLowerCase();
  const matchesSelectedKey = inputLower && inputLower === selectedKey.toLowerCase();
  const colors = getThemeFromControls();

  let targetName = inputName;
  let targetKey = null;
  if (isSelectedFile && (!targetName || matchesSelectedLabel || matchesSelectedKey)) {
    targetName = selectedLabel;
    targetKey = selectedKey;
  } else {
    if (!targetName || (isSelectedBuiltin && (matchesSelectedLabel || matchesSelectedKey))) {
      if (isSelectedBuiltin) {
        targetName = buildEditName(selectedLabel);
      } else {
        targetName = buildEditName("Custom");
      }
    } else if (RESERVED_PRESET_KEYS.has(targetName.toLowerCase())) {
      targetName = buildEditName(isSelectedBuiltin ? selectedLabel : targetName);
    } else if (isNameTaken(targetName, selectedKey)) {
      targetName = buildEditName(targetName);
    }
  }

  const result = await saveThemePreset({ key: targetKey, name: targetName, colors });
  if (!result || !Array.isArray(result.presets)) {
    showToast("Could not save theme.", true);
    return;
  }
  setThemeFilePresets(result.presets);
  const selected = result.selectedKey
    || findFilePresetKeyByName(targetName)
    || targetKey
    || "default";
  themeStore.selectedPreset = selected;
  refreshThemePresetOptions(selected);
  applyTheme(colors);
  updatePresetActions(selected);
  void saveThemeStore();
  showToast(`Theme saved: ${targetName}`);
}

export async function handleThemePresetDelete() {
  const selected = resolvePresetKey(dom.settingsTheme.value);
  if (!isFilePreset(selected)) {
    showToast("Select a saved theme to delete.", true);
    return;
  }
  const label = getPresetLabel(selected) || selected;
  const confirmed = window.confirm(`Delete the "${label}" theme?`);
  if (!confirmed) {
    return;
  }
  const result = await deleteThemePreset(selected);
  if (!result || !Array.isArray(result.presets)) {
    showToast("Could not delete theme.", true);
    return;
  }
  setThemeFilePresets(result.presets);
  themeStore.selectedPreset = "default";
  const colors = getPresetColors("default");
  refreshThemePresetOptions("default");
  applyTheme(colors);
  syncThemeControls(colors);
  updatePresetActions("default");
  void saveThemeStore();
  showToast("Theme deleted.");
}

export async function handleThemePresetImport() {
  if (!themeApi?.importThemePreset) {
    showToast("Theme import not available.", true);
    return;
  }
  const result = await themeApi.importThemePreset();
  if (!result || result.cancelled) {
    return;
  }
  if (!result.ok || !Array.isArray(result.presets)) {
    showToast("Could not import theme.", true);
    return;
  }
  setThemeFilePresets(result.presets);
  const selected = result.selectedKey || "default";
  themeStore.selectedPreset = selected;
  const colors = getPresetColors(selected);
  refreshThemePresetOptions(selected);
  syncThemeControls(colors);
  applyTheme(colors);
  updatePresetActions(selected);
  void saveThemeStore();
  showToast(`Theme imported: ${getPresetLabel(selected)}`);
}

export async function handleThemePresetExport() {
  if (!themeApi?.exportThemePreset) {
    showToast("Theme export not available.", true);
    return;
  }
  const selected = resolvePresetKey(dom.settingsTheme.value);
  const label = selected === "custom"
    ? (dom.themePresetName?.value || "").trim() || "Custom Theme"
    : getPresetLabel(selected);
  const colors = selected === "custom" ? getThemeFromControls() : getPresetColors(selected);
  const result = await themeApi.exportThemePreset({ name: label, colors });
  if (!result || result.cancelled) {
    return;
  }
  if (!result.ok) {
    showToast("Could not export theme.", true);
    return;
  }
  showToast("Theme exported.");
}

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
  const customColors = raw?.customColors ? normalizeThemeColors(raw.customColors) : null;
  return { selectedPreset, customColors };
}

function setThemeFilePresets(presets) {
  themeFilePresets = {};
  if (!Array.isArray(presets)) {
    return;
  }
  presets.forEach(preset => {
    if (!preset || typeof preset.key !== "string") {
      return;
    }
    if (RESERVED_PRESET_KEYS.has(preset.key.toLowerCase())) {
      return;
    }
    const name = typeof preset.name === "string" && preset.name.trim()
      ? preset.name.trim()
      : preset.key;
    themeFilePresets[preset.key] = {
      name,
      colors: preset.colors || {}
    };
  });
}

function getPresetLabel(key) {
  if (!key) {
    return "";
  }
  if (BUILTIN_PRESETS.includes(key)) {
    return THEME_PRESET_LABELS[key] || key;
  }
  const preset = themeFilePresets[key];
  if (preset?.name) {
    return preset.name;
  }
  return key;
}

function findFilePresetKeyByName(name) {
  const target = (name || "").toLowerCase();
  return Object.keys(themeFilePresets || {}).find(key => {
    const presetName = themeFilePresets[key]?.name || key;
    return presetName.toLowerCase() === target;
  });
}

function isFilePreset(key) {
  return Boolean(themeFilePresets && Object.prototype.hasOwnProperty.call(themeFilePresets, key));
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
  if (isFilePreset(candidate)) {
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
  if (isFilePreset(key)) {
    return normalizeThemeColors(themeFilePresets[key].colors);
  }
  return normalizeThemeColors(THEMES.default);
}

function refreshThemePresetOptions(selected) {
  if (!dom.settingsTheme) {
    return;
  }
  dom.settingsTheme.innerHTML = "";

  const presetGroup = document.createElement("optgroup");
  presetGroup.label = t("settings.theme.savedLabel");
  BUILTIN_PRESETS.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = getPresetLabel(name);
    presetGroup.appendChild(option);
  });
  Object.keys(themeFilePresets || {})
    .sort((a, b) => getPresetLabel(a).localeCompare(getPresetLabel(b)))
    .forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = getPresetLabel(name);
      presetGroup.appendChild(option);
    });
  dom.settingsTheme.appendChild(presetGroup);

  const customGroup = document.createElement("optgroup");
  customGroup.label = t("settings.theme.customGroupLabel");
  const customOption = document.createElement("option");
  customOption.value = "custom";
  customOption.textContent = t("settings.theme.customUnsaved");
  customGroup.appendChild(customOption);
  dom.settingsTheme.appendChild(customGroup);

  dom.settingsTheme.value = resolvePresetKey(selected);
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
  if (dom.themePresetDelete) {
    dom.themePresetDelete.disabled = !isFilePreset(selected);
  }
  if (dom.themePresetName) {
    dom.themePresetName.value = isFilePreset(selected) ? getPresetLabel(selected) : "";
  }
}

function isNameTaken(name, selectedKey) {
  const target = name.toLowerCase();
  if (RESERVED_PRESET_KEYS.has(target)) {
    return true;
  }
  if (BUILTIN_PRESETS.some(key => getPresetLabel(key).toLowerCase() === target)) {
    return true;
  }
  const keyMatch = Object.keys(themeFilePresets || {}).find(key => key.toLowerCase() === target);
  if (keyMatch && (!selectedKey || keyMatch.toLowerCase() !== selectedKey.toLowerCase())) {
    return true;
  }
  const existing = findFilePresetKeyByName(name);
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
  while (RESERVED_PRESET_KEYS.has(candidate.toLowerCase()) || isNameTaken(candidate)) {
    index += 1;
    candidate = `${base} - Edit ${index}`;
  }
  return candidate;
}

function migrateLegacyTheme(store) {
  const legacyColors = localStorage.getItem("themeColors");
  const legacyPreset = localStorage.getItem("themePreset");
  const hasCustom = Boolean(store.customColors);
  if (!legacyColors || hasCustom) {
    return false;
  }
  try {
    const parsed = JSON.parse(legacyColors);
    store.customColors = normalizeThemeColors(parsed);
    store.selectedPreset = legacyPreset || "custom";
    localStorage.removeItem("themeColors");
    localStorage.removeItem("themePreset");
    return true;
  } catch (err) {
    return false;
  }
}

async function fetchThemeStore() {
  if (!themeApi?.getThemeStore) {
    return normalizeThemeStore({});
  }
  try {
    const stored = await themeApi.getThemeStore();
    return normalizeThemeStore(stored);
  } catch (err) {
    return normalizeThemeStore({});
  }
}

async function fetchThemePresets() {
  if (!themeApi?.getThemePresets) {
    return [];
  }
  try {
    const stored = await themeApi.getThemePresets();
    return Array.isArray(stored?.presets) ? stored.presets : Array.isArray(stored) ? stored : [];
  } catch (err) {
    return [];
  }
}

async function saveThemeStore() {
  if (!themeApi?.saveThemeStore) {
    return;
  }
  try {
    const stored = await themeApi.saveThemeStore(themeStore);
    themeStore = normalizeThemeStore(stored);
  } catch (err) {
    // Ignore save errors.
  }
}

async function saveThemePreset(payload) {
  if (!themeApi?.saveThemePreset) {
    return null;
  }
  try {
    const stored = await themeApi.saveThemePreset(payload);
    if (stored && typeof stored === "object") {
      return stored;
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function deleteThemePreset(key) {
  if (!themeApi?.deleteThemePreset) {
    return null;
  }
  try {
    const stored = await themeApi.deleteThemePreset(key);
    if (stored && typeof stored === "object") {
      return stored;
    }
    return null;
  } catch (err) {
    return null;
  }
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

function getLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }
  const channels = [rgb.r, rgb.g, rgb.b].map(value => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getContrastColor(hex) {
  const luminance = getLuminance(hex);
  return luminance > 0.55 ? "#000000" : "#FFFFFF";
}
