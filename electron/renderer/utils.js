// Utility functions for VRChat Event Creator

import { TAG_LIMIT, TAG_TEXT_LIMIT } from "./config.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

export async function handleOpenDataDir(api) {
  await api.openDataDir();
}

export async function handleChangeDataDir(api) {
  const selectedPath = await api.selectDataDir();
  if (selectedPath) {
    showToast("Data directory will change on next restart. Please set VRC_EVENT_DATA_DIR environment variable to: " + selectedPath, false);
  }
}

// ============================================================================
// Timezone Utilities
// ============================================================================

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString() {
  return formatDateInput(new Date());
}

export function getMaxEventDateString() {
  const max = new Date();
  max.setFullYear(max.getFullYear() + 1);
  return formatDateInput(max);
}

export function getTimeZoneAbbr(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short"
    }).formatToParts(new Date());
    const part = parts.find(p => p.type === "timeZoneName");
    return part ? part.value : timeZone;
  } catch (err) {
    return timeZone;
  }
}

export function buildTimezones() {
  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const systemAbbr = getTimeZoneAbbr(systemTz);
  const list = [
    { label: `System Default (${systemAbbr})`, value: systemTz },
    { label: "PST (Pacific Standard Time)", value: "America/Los_Angeles" },
    { label: "MST (Mountain Standard Time)", value: "America/Denver" },
    { label: "CST (Central Standard Time)", value: "America/Chicago" },
    { label: "EST (Eastern Standard Time)", value: "America/New_York" },
    { label: "AKST (Alaska Standard Time)", value: "America/Anchorage" },
    { label: "HST (Hawaii Standard Time)", value: "Pacific/Honolulu" },
    { label: "GMT (Greenwich Mean Time)", value: "Europe/London" },
    { label: "CET (Central European Time)", value: "Europe/Paris" },
    { label: "EET (Eastern European Time)", value: "Europe/Athens" },
    { label: "JST (Japan Standard Time)", value: "Asia/Tokyo" },
    { label: "KST (Korea Standard Time)", value: "Asia/Seoul" },
    { label: "Beijing Time", value: "Asia/Shanghai" },
    { label: "IST (India Standard Time)", value: "Asia/Kolkata" },
    { label: "PHT (Philippines Time)", value: "Asia/Manila" },
    { label: "ICT (Indochina Time)", value: "Asia/Bangkok" },
    { label: "WIB (Western Indonesia Time)", value: "Asia/Jakarta" },
    { label: "Arabian Standard Time", value: "Asia/Dubai" },
    { label: "Iran Standard Time", value: "Asia/Tehran" },
    { label: "WAT (West Africa Time)", value: "Africa/Lagos" },
    { label: "CAT (Central Africa Time)", value: "Africa/Johannesburg" },
    { label: "EAT (East Africa Time)", value: "Africa/Nairobi" },
    { label: "AEST (Australian Eastern Time)", value: "Australia/Sydney" },
    { label: "NZST (New Zealand Standard Time)", value: "Pacific/Auckland" },
    { label: "AWST (Australian Western Time)", value: "Australia/Perth" },
    { label: "BRT (Brasilia Time)", value: "America/Sao_Paulo" },
    { label: "ART (Argentina Time)", value: "America/Argentina/Buenos_Aires" },
    { label: "CLT (Chile Standard Time)", value: "America/Santiago" },
    { label: "MSK (Moscow Time)", value: "Europe/Moscow" }
  ];
  return { systemTz, list };
}

export function ensureTimezoneOption(selectEl, value) {
  const exists = Array.from(selectEl.options).some(option => option.value === value);
  if (!exists && value) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectEl.appendChild(option);
  }
}

// ============================================================================
// Tag Utilities
// ============================================================================

const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value, options = {}) {
  const { maxLength, allowNewlines = false, trim = true } = options;
  let cleaned = String(value ?? "");
  if (!allowNewlines) {
    cleaned = cleaned.replace(/[\r\n]+/g, " ");
  }
  cleaned = cleaned.replace(CONTROL_CHARS_REGEX, "");
  if (trim) {
    cleaned = cleaned.trim();
  }
  if (typeof maxLength === "number" && maxLength > 0 && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

export function sanitizeSingleLine(value, maxLength, trim = true) {
  return sanitizeText(value, { maxLength, allowNewlines: false, trim });
}

export function sanitizeUsername(value) {
  return sanitizeSingleLine(value, 128, true);
}

export function sanitizePassword(value) {
  let cleaned = String(value ?? "");
  cleaned = cleaned.replace(/[\r\n]+/g, "");
  cleaned = cleaned.replace(CONTROL_CHARS_REGEX, "");
  if (cleaned.length > 256) {
    cleaned = cleaned.slice(0, 256);
  }
  return cleaned;
}

export function sanitizeTag(value, maxLength = TAG_TEXT_LIMIT) {
  const cleaned = sanitizeSingleLine(value, maxLength, true);
  return cleaned.replace(/\s+/g, " ");
}

// ============================================================================
// Duration Utilities
// ============================================================================

const MAX_DURATION_DAYS = 31;
const MAX_DURATION_MINUTES = MAX_DURATION_DAYS * 24 * 60;

function padDuration(value) {
  return String(value).padStart(2, "0");
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.min(MAX_DURATION_MINUTES, Math.round(Number(minutes) || 0)));
  const days = Math.floor(total / (24 * 60));
  const hours = Math.floor((total % (24 * 60)) / 60);
  const mins = total % 60;
  return `${padDuration(days)}:${padDuration(hours)}:${padDuration(mins)}`;
}

export function parseDurationInput(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const parts = raw.split(":").map(part => part.replace(/[^\d]/g, "")).filter(part => part.length);
  if (!parts.length) {
    return null;
  }
  const numbers = parts.map(part => Number.parseInt(part, 10)).filter(Number.isFinite);
  if (!numbers.length) {
    return null;
  }
  let totalMinutes = 0;
  if (numbers.length === 1) {
    totalMinutes = numbers[0];
  } else if (numbers.length === 2) {
    totalMinutes = numbers[0] * 60 + numbers[1];
  } else {
    totalMinutes = numbers[0] * 24 * 60 + numbers[1] * 60 + numbers[2];
  }
  totalMinutes = Math.max(0, Math.min(MAX_DURATION_MINUTES, totalMinutes));
  return {
    minutes: totalMinutes,
    formatted: formatDuration(totalMinutes)
  };
}

export function sanitizeDurationInputValue(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 6);
  if (!digits) {
    return "";
  }
  const parts = [];
  for (let i = 0; i < digits.length; i += 2) {
    parts.push(digits.slice(i, i + 2));
  }
  return parts.join(":");
}

export function normalizeDurationInput(inputEl, fallbackMinutes = null) {
  if (!inputEl) {
    return null;
  }
  const parsed = parseDurationInput(inputEl.value);
  if (!parsed || parsed.minutes < 1) {
    if (typeof fallbackMinutes === "number") {
      inputEl.value = formatDuration(fallbackMinutes);
      return fallbackMinutes;
    }
    inputEl.value = "";
    return null;
  }
  inputEl.value = parsed.formatted;
  return parsed.minutes;
}

export function formatDurationPreview(value, units = {}) {
  const normalizeUnit = (unit, fallback) => {
    const text = typeof unit === "string" ? unit.trim() : "";
    if (!text || text.includes("durationUnits.")) {
      return fallback;
    }
    return text;
  };
  const dayUnit = normalizeUnit(units.day, "d");
  const hourUnit = normalizeUnit(units.hour, "hr");
  const minuteUnit = normalizeUnit(units.minute, "min");
  const placeholder = `--${dayUnit} --${hourUnit} --${minuteUnit}`;
  const parsed = parseDurationInput(value);
  if (!parsed) {
    return placeholder;
  }
  const total = parsed.minutes;
  const days = Math.floor(total / (24 * 60));
  const hours = Math.floor((total % (24 * 60)) / 60);
  const mins = total % 60;
  return `${days}${dayUnit} ${hours}${hourUnit} ${mins}${minuteUnit}`;
}

export function parseTags(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map(tag => sanitizeTag(tag))
    .filter(tag => tag.length > 0);
}

export function enforceTagsInput(inputEl, max, notify = false) {
  const tags = parseTags(inputEl.value);
  if (tags.length > max) {
    const trimmed = tags.slice(0, max);
    inputEl.value = trimmed.join(", ");
    if (notify) {
      showToast(`Only ${max} tags allowed. Extra tags removed.`, true);
    }
    return trimmed;
  }
  return tags;
}

export function createTagInput(options) {
  const { inputEl, chipContainer, wrapperEl, maxTags = TAG_LIMIT, maxTagLength = TAG_TEXT_LIMIT } = options || {};
  if (!inputEl || !chipContainer) {
    return null;
  }

  let tags = [];

  function render() {
    chipContainer.innerHTML = "";
    tags.forEach((tag, index) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      const label = document.createElement("span");
      label.className = "tag-chip-label";
      label.textContent = tag;
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "tag-chip-remove";
      removeBtn.dataset.tagIndex = String(index);
      removeBtn.setAttribute("aria-label", `Remove tag ${tag}`);
      removeBtn.textContent = "x";
      chip.appendChild(label);
      chip.appendChild(removeBtn);
      chipContainer.appendChild(chip);
    });
  }

  function normalizeTags(list) {
    const inputList = Array.isArray(list) ? list : parseTags(list);
    const next = [];
    const seen = new Set();
    inputList.forEach(raw => {
      const cleaned = sanitizeTag(raw, maxTagLength);
      if (!cleaned) {
        return;
      }
      const key = cleaned.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      if (next.length >= maxTags) {
        return;
      }
      seen.add(key);
      next.push(cleaned);
    });
    return next;
  }

  function addTags(list, notify = false) {
    const inputList = Array.isArray(list) ? list : parseTags(list);
    const seen = new Set(tags.map(tag => tag.toLowerCase()));
    let limited = false;
    inputList.forEach(raw => {
      const cleaned = sanitizeTag(raw, maxTagLength);
      if (!cleaned) {
        return;
      }
      const key = cleaned.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      if (tags.length >= maxTags) {
        limited = true;
        return;
      }
      tags.push(cleaned);
      seen.add(key);
    });
    if (limited && notify) {
      showToast(`Only ${maxTags} tags allowed. Extra tags removed.`, true);
    }
    render();
  }

  function commitInput(notify = false) {
    const value = inputEl.value;
    if (!value) {
      return;
    }
    addTags(parseTags(value), notify);
    inputEl.value = "";
  }

  function removeTagAt(index) {
    if (index < 0 || index >= tags.length) {
      return;
    }
    tags.splice(index, 1);
    render();
  }

  function setTags(next) {
    tags = normalizeTags(next);
    render();
  }

  function getTags() {
    return tags.slice();
  }

  chipContainer.addEventListener("click", event => {
    const button = event.target.closest(".tag-chip-remove");
    if (!button) {
      return;
    }
    const index = Number.parseInt(button.dataset.tagIndex, 10);
    if (Number.isFinite(index)) {
      removeTagAt(index);
    }
  });

  if (wrapperEl) {
    wrapperEl.addEventListener("click", event => {
      if (event.target === inputEl) {
        return;
      }
      inputEl.focus();
    });
  }

  inputEl.addEventListener("keydown", event => {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      commitInput(true);
      return;
    }
    if (event.key === "Backspace" && !inputEl.value) {
      removeTagAt(tags.length - 1);
    }
  });

  inputEl.addEventListener("blur", () => commitInput(true));
  inputEl.addEventListener("paste", event => {
    const text = event.clipboardData?.getData("text");
    if (text && text.includes(",")) {
      event.preventDefault();
      addTags(parseTags(text), true);
      return;
    }
    if (text && tags.length >= maxTags) {
      event.preventDefault();
      showToast(`Only ${maxTags} tags allowed. Extra tags removed.`, true);
    }
  });

  if (inputEl.value) {
    setTags(parseTags(inputEl.value));
    inputEl.value = "";
  } else {
    render();
  }

  return { getTags, setTags, clear: () => setTags([]), commit: () => commitInput(true) };
}

// ============================================================================
// Profile Key Utilities
// ============================================================================

export function slugifyProfileKey(value) {
  const base = (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 40);
}

export function getUniqueProfileKey(groupId, base) {
  const groupProfiles = state.profiles[groupId] || {};
  if (!groupProfiles[base]) {
    return base;
  }
  let counter = 1;
  while (groupProfiles[`${base}-${counter}`]) {
    counter++;
  }
  return `${base}-${counter}`;
}

export function buildProfileKey(groupId, displayName, fallbackName) {
  const base = slugifyProfileKey(displayName || fallbackName);
  if (!base) {
    return `profile-${Date.now()}`;
  }
  return getUniqueProfileKey(groupId, base);
}

// ============================================================================
// Group Utilities
// ============================================================================

export function getGroupName(groupId) {
  const group = state.groups.find(g => g.id === groupId);
  return group ? group.name : groupId;
}

export function getGroupById(groupId) {
  return (state.groups || []).find(group => group.groupId === groupId || group.id === groupId);
}

export function isPrivateGroup(groupId) {
  const group = getGroupById(groupId);
  return group?.privacy === "private";
}

export function enforceGroupAccess(selectEl, groupId) {
  if (!selectEl) {
    return;
  }
  const privateGroup = isPrivateGroup(groupId);
  Array.from(selectEl.options).forEach(option => {
    if (option.value === "public") {
      option.disabled = privateGroup;
    }
  });
  if (privateGroup && (!selectEl.value || selectEl.value === "public")) {
    selectEl.value = "group";
  }
}
