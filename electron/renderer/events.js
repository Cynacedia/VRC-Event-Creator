import { dom, state, getEventWizard } from "./state.js";
import { showToast, renderSelect, renderChecklist } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, formatDurationPreview, enforceGroupAccess, getMaxEventDateString, getRateLimitRemainingMs, clearRateLimit, isRateLimitError } from "./utils.js";
import { EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, LANGUAGES, PLATFORMS, TAG_LIMIT } from "./config.js";
import { t, getCurrentLanguage, getLanguageDisplayName } from "./i18n/index.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

const EVENT_HOURLY_LIMIT = 10;
const EVENT_HOURLY_WINDOW_MS = 60 * 60 * 1000;
const CREATE_RATE_LIMIT_BASE_KEY = "events:create";
const HOURLY_HISTORY_STORAGE_KEY = "vrc-event-hourly-history-v1";
const CREATED_EVENTS_STORAGE_KEY = "vrc-event-created-ids-v1";
const BACKOFF_SEQUENCE = [2, 4, 8, 16, 32, 60]; // minutes
let roleFetchToken = 0;
let hourlyCountTimer = null;
let createBlockTimer = null;
let hourlyHistoryLoaded = false;
let createdEventIdsLoaded = false;
let conflictResolve = null;

/**
 * Shows the conflict modal and returns a Promise.
 * Resolves with { continue: true } to proceed, or { continue: false, changeTime: true/false }
 */
function showConflictModal(eventTitle) {
  return new Promise(resolve => {
    conflictResolve = resolve;
    dom.conflictMessage.textContent = t("conflict.message", { title: eventTitle });
    dom.conflictSkipSession.checked = false;
    dom.conflictOverlay.classList.remove("is-hidden");
  });
}

function hideConflictModal() {
  dom.conflictOverlay.classList.add("is-hidden");
  conflictResolve = null;
}

function handleConflictContinue() {
  if (dom.conflictSkipSession.checked) {
    state.session.skipConflictWarning = true;
  }
  hideConflictModal();
  if (conflictResolve) {
    conflictResolve({ continue: true });
  }
}

function handleConflictChangeTime() {
  hideConflictModal();
  if (conflictResolve) {
    conflictResolve({ continue: false, changeTime: true });
  }
}

function pruneHistoryEntries(entries) {
  const cutoff = Date.now() - EVENT_HOURLY_WINDOW_MS;
  return entries.filter(entry => entry >= cutoff);
}

function loadHourlyHistory() {
  if (hourlyHistoryLoaded) {
    return;
  }
  hourlyHistoryLoaded = true;
  try {
    const raw = localStorage.getItem(HOURLY_HISTORY_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }
    const normalized = {};
    Object.entries(parsed).forEach(([groupId, entries]) => {
      if (!Array.isArray(entries)) {
        return;
      }
      const cleaned = entries
        .map(entry => Number(entry))
        .filter(entry => Number.isFinite(entry));
      const pruned = pruneHistoryEntries(cleaned);
      if (pruned.length) {
        normalized[groupId] = pruned;
      }
    });
    state.event.hourlyCreateHistory = normalized;
    saveHourlyHistory();
  } catch (err) {
    // Ignore storage errors.
  }
}

function saveHourlyHistory() {
  if (!hourlyHistoryLoaded) {
    return;
  }
  try {
    localStorage.setItem(HOURLY_HISTORY_STORAGE_KEY, JSON.stringify(state.event.hourlyCreateHistory));
  } catch (err) {
    // Ignore storage errors.
  }
}

function ensureHourlyHistoryLoaded() {
  if (!hourlyHistoryLoaded) {
    loadHourlyHistory();
  }
}

function loadCreatedEventIds() {
  if (createdEventIdsLoaded) {
    return;
  }
  createdEventIdsLoaded = true;
  try {
    const raw = localStorage.getItem(CREATED_EVENTS_STORAGE_KEY);
    if (!raw) {
      state.event.createdEventIds = {};
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      state.event.createdEventIds = {};
      return;
    }
    const normalized = {};
    Object.entries(parsed).forEach(([key, entries]) => {
      if (!Array.isArray(entries)) {
        return;
      }
      const pruned = entries.filter(entry => {
        if (!entry || typeof entry !== "object") {
          return false;
        }
        if (!entry.id || !Number.isFinite(entry.timestamp)) {
          return false;
        }
        return entry.timestamp >= (Date.now() - EVENT_HOURLY_WINDOW_MS);
      });
      if (pruned.length) {
        normalized[key] = pruned;
      }
    });
    state.event.createdEventIds = normalized;
    saveCreatedEventIds();
  } catch (err) {
    state.event.createdEventIds = {};
  }
}

function saveCreatedEventIds() {
  if (!createdEventIdsLoaded) {
    return;
  }
  try {
    localStorage.setItem(CREATED_EVENTS_STORAGE_KEY, JSON.stringify(state.event.createdEventIds));
  } catch (err) {
    // Ignore storage errors.
  }
}

function ensureCreatedEventIdsLoaded() {
  if (!createdEventIdsLoaded) {
    loadCreatedEventIds();
  }
}

function recordCreatedEventId(groupId, eventId, timestamp) {
  ensureCreatedEventIdsLoaded();
  if (!groupId || !eventId) {
    return;
  }
  const userId = getCurrentUserId();
  if (!userId) {
    return;
  }
  const key = `${userId}::${groupId}`;
  if (!state.event.createdEventIds[key]) {
    state.event.createdEventIds[key] = [];
  }
  const entry = { id: eventId, timestamp };
  state.event.createdEventIds[key].push(entry);
  const cutoff = Date.now() - EVENT_HOURLY_WINDOW_MS;
  state.event.createdEventIds[key] = state.event.createdEventIds[key]
    .filter(e => e.timestamp >= cutoff);
  saveCreatedEventIds();
}

function getCurrentUserId() {
  return state.user?.id || state.user?.userId || null;
}

function getHistoryKey(groupId) {
  ensureHourlyHistoryLoaded();
  if (!groupId) {
    return null;
  }
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }
  const key = `${userId}::${groupId}`;
  if (!state.event.hourlyCreateHistory[key] && state.event.hourlyCreateHistory[groupId]) {
    state.event.hourlyCreateHistory[key] = state.event.hourlyCreateHistory[groupId];
    delete state.event.hourlyCreateHistory[groupId];
    saveHourlyHistory();
  }
  return key;
}

function getCreateRateLimitKey(groupId) {
  const userId = getCurrentUserId() || "user";
  const groupKey = groupId || "group";
  return `${CREATE_RATE_LIMIT_BASE_KEY}:${userId}:${groupKey}`;
}

function getRoleLabels() {
  return {
    allAccess: t("events.roleRestrictions.allAccess"),
    managementRoles: t("events.roleRestrictions.managementRoles"),
    roles: t("events.roleRestrictions.roles"),
    noRoles: t("events.roleRestrictions.noRoles")
  };
}

function getHourlyHistory(groupId) {
  ensureHourlyHistoryLoaded();
  const key = getHistoryKey(groupId);
  if (!key) {
    return [];
  }
  if (!state.event.hourlyCreateHistory[key]) {
    state.event.hourlyCreateHistory[key] = [];
  }
  return state.event.hourlyCreateHistory[key];
}

function pruneHourlyHistory(groupId) {
  const key = getHistoryKey(groupId);
  if (!key) {
    return [];
  }
  const history = getHourlyHistory(groupId);
  const next = pruneHistoryEntries(history);
  if (next.length !== history.length) {
    state.event.hourlyCreateHistory[key] = next;
    saveHourlyHistory();
  } else if (state.event.hourlyCreateHistory[key] !== history) {
    state.event.hourlyCreateHistory[key] = history;
  }
  return next;
}

function getHourlyCount(groupId) {
  if (!groupId) {
    return 0;
  }
  return pruneHourlyHistory(groupId).length;
}

function recordHourlyEvent(groupId, timestamp = Date.now(), eventId = null) {
  if (!groupId || !getCurrentUserId()) {
    return;
  }
  const history = getHourlyHistory(groupId);
  history.push(timestamp);
  pruneHourlyHistory(groupId);
  saveHourlyHistory();
  if (eventId) {
    recordCreatedEventId(groupId, eventId, timestamp);
  }
}

function getEventCreatedAtMs(event) {
  if (!event) {
    return null;
  }
  const value = event.createdAtUtc || event.createdAt || event.created_at || null;
  if (!value) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function updateServerHourlyCount(events) {
  // Count ALL events created in the last hour (by anyone) for cross-platform detection
  if (!Array.isArray(events)) {
    state.event.serverHourlyCount = 0;
    return;
  }
  const cutoff = Date.now() - EVENT_HOURLY_WINDOW_MS;
  const count = events.filter(event => {
    const createdAtMs = getEventCreatedAtMs(event);
    return Number.isFinite(createdAtMs) && createdAtMs >= cutoff;
  }).length;
  state.event.serverHourlyCount = count;
}

function getTotalLocalCount(groupId) {
  // Sum events from ALL users for this group (for cross-platform detection)
  ensureHourlyHistoryLoaded();
  if (!groupId) {
    return 0;
  }
  const suffix = `::${groupId}`;
  const cutoff = Date.now() - EVENT_HOURLY_WINDOW_MS;
  let total = 0;
  Object.entries(state.event.hourlyCreateHistory).forEach(([key, entries]) => {
    if (!key.endsWith(suffix)) {
      return;
    }
    if (!Array.isArray(entries)) {
      return;
    }
    total += entries.filter(ts => ts >= cutoff).length;
  });
  return total;
}

function getNextBackoffMinutes() {
  const minutes = BACKOFF_SEQUENCE[state.event.backoffIndex];
  state.event.backoffIndex = (state.event.backoffIndex + 1) % BACKOFF_SEQUENCE.length;
  return minutes;
}

function resetBackoff() {
  state.event.backoffIndex = 0;
}

function getRateLimitMessage(rateLimitInfo) {
  if (!rateLimitInfo) {
    return t("events.unknownRateLimit");
  }
  const { case: rateLimitCase, minutes } = rateLimitInfo;
  if (rateLimitCase === "A") {
    // User hit their 10/hour limit - use existing message
    return t("events.upcomingLimitError");
  }
  if (rateLimitCase === "B") {
    // Cross-platform events
    return t("events.crossPlatformRateLimit", { minutes: minutes || 2 });
  }
  // Case C: Unknown hard limit
  return t("events.unknownRateLimit");
}

function getNextHourlyExpiry(groupId) {
  const history = pruneHourlyHistory(groupId);
  if (!history.length) {
    return null;
  }
  const earliest = Math.min(...history);
  return earliest + EVENT_HOURLY_WINDOW_MS;
}

function getHourlyLimitRemainingMs(groupId) {
  const key = getHistoryKey(groupId);
  if (!key) {
    return 0;
  }
  const until = state.event.hourlyLimitUntil[key] || 0;
  if (!until) {
    return 0;
  }
  const remaining = until - Date.now();
  if (remaining <= 0) {
    delete state.event.hourlyLimitUntil[key];
    return 0;
  }
  return remaining;
}

function setHourlyLimitUntil(groupId, until) {
  const key = getHistoryKey(groupId);
  if (!key || !until) {
    return;
  }
  state.event.hourlyLimitUntil[key] = until;
}

function clearHourlyLimit(groupId) {
  const key = getHistoryKey(groupId);
  if (!key) {
    return;
  }
  delete state.event.hourlyLimitUntil[key];
}

function getCreateBlockRemainingMs(groupId) {
  const hourlyRemaining = getHourlyLimitRemainingMs(groupId);
  const backoffRemaining = getRateLimitRemainingMs(getCreateRateLimitKey(groupId));
  return Math.max(hourlyRemaining, backoffRemaining);
}

function scheduleHourlyCountUpdate(groupId) {
  if (hourlyCountTimer) {
    window.clearTimeout(hourlyCountTimer);
    hourlyCountTimer = null;
  }
  if (!groupId) {
    return;
  }
  const nextExpiry = getNextHourlyExpiry(groupId);
  if (!nextExpiry) {
    return;
  }
  const delayMs = Math.max(0, nextExpiry - Date.now());
  hourlyCountTimer = window.setTimeout(() => {
    renderUpcomingEventCount();
    updateEventCreateDisabled();
  }, delayMs + 50);
}

function scheduleCreateBlockTimer(groupId) {
  if (createBlockTimer) {
    window.clearTimeout(createBlockTimer);
    createBlockTimer = null;
  }
  const remaining = getCreateBlockRemainingMs(groupId);
  if (remaining <= 0) {
    return;
  }
  createBlockTimer = window.setTimeout(() => {
    updateEventCreateDisabled();
  }, remaining + 50);
}

function handleCreateRateLimit(groupId) {
  const userLocalCount = getHourlyCount(groupId);
  const totalLocalCount = getTotalLocalCount(groupId);
  const serverCount = state.event.serverHourlyCount;

  // Case A: User hit their 10/hour limit
  if (userLocalCount >= EVENT_HOURLY_LIMIT) {
    const nextExpiry = getNextHourlyExpiry(groupId);
    if (nextExpiry) {
      setHourlyLimitUntil(groupId, nextExpiry);
    }
    scheduleCreateBlockTimer(groupId);
    return { case: "A", minutes: null };
  }

  // Case B: Cross-platform events (totalLocal < server)
  // Case C: Unknown hard limit (totalLocal == server but still got 429)
  const isCrossPlatform = totalLocalCount < serverCount;
  const backoffMinutes = getNextBackoffMinutes();
  const blockUntil = Date.now() + (backoffMinutes * 60 * 1000);
  setHourlyLimitUntil(groupId, blockUntil);
  scheduleCreateBlockTimer(groupId);

  return {
    case: isCrossPlatform ? "B" : "C",
    minutes: backoffMinutes
  };
}

function updateEventCreateDisabled() {
  const groupId = dom.eventGroup?.value;
  const isRateLimited = getCreateBlockRemainingMs(groupId) > 0;
  state.event.createBlocked = isRateLimited;
  dom.eventCreate.disabled = !state.user
    || isRateLimited
    || state.event.createInProgress
    || state.app?.updateAvailable;
}

function getGroupName(groupId) {
  if (!groupId) {
    return "";
  }
  const group = state.groups.find(entry => entry.groupId === groupId);
  return group?.name || "";
}

function getDurationUnits() {
  return {
    day: t("common.durationUnits.day"),
    hour: t("common.durationUnits.hour"),
    minute: t("common.durationUnits.minute")
  };
}

function formatPatternDateLabel(option, locale, timezone) {
  if (!option) {
    return "";
  }
  if (!option.iso) {
    return "";
  }
  const resolvedLocale = locale || getCurrentLanguage();
  const resolvedTimezone = timezone || dom.eventTimezone?.value || buildTimezones().systemTz;
  const date = new Date(option.iso);
  let dateLabel = "";
  let timeLabel = "";
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
      const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, { timeZone: resolvedTimezone, month: "short", day: "2-digit" });
      const timeFormatter = new Intl.DateTimeFormat(resolvedLocale, { timeZone: resolvedTimezone, hour: "numeric", minute: "2-digit" });
      dateLabel = dateFormatter.format(date);
      timeLabel = timeFormatter.format(date);
    } else {
      dateLabel = date.toLocaleDateString(resolvedLocale, { timeZone: resolvedTimezone, month: "short", day: "2-digit" });
      timeLabel = date.toLocaleTimeString(resolvedLocale, { timeZone: resolvedTimezone, hour: "numeric", minute: "2-digit" });
    }
  } catch (err) {
    dateLabel = date.toLocaleDateString();
    timeLabel = date.toLocaleTimeString();
  }

  const weekday = option.weekday || "";
  const weekdayKey = weekday ? `common.weekdays.${weekday}` : "";
  const translatedWeekday = weekdayKey ? t(weekdayKey) : "";
  const weekdayLabel = !weekdayKey || translatedWeekday === weekdayKey ? weekday : translatedWeekday;
  let baseLabel = "";
  if (option.isLast) {
    baseLabel = t("profiles.patterns.format.last", { weekday: weekdayLabel, time: timeLabel });
  } else {
    const ordinalKey = `profiles.patterns.ordinal${option.occurrence}`;
    const ordinal = t(ordinalKey);
    const ordinalLabel = ordinal === ordinalKey ? `${option.occurrence}` : ordinal;
    baseLabel = t("profiles.patterns.format.nth", { ordinal: ordinalLabel, weekday: weekdayLabel, time: timeLabel });
  }

  return t("events.patternDateLabel", { label: baseLabel, date: dateLabel });
}

export function updateEventDurationPreview() {
  if (!dom.eventDurationPreview || !dom.eventDuration) {
    return;
  }
  dom.eventDurationPreview.textContent = formatDurationPreview(dom.eventDuration.value, getDurationUnits());
}

function renderUpcomingEventCount() {
  if (!dom.eventUpcomingCount) {
    return;
  }
  ensureHourlyHistoryLoaded();
  if (dom.eventCountRefresh) {
    dom.eventCountRefresh.disabled = !state.user || !dom.eventGroup.value;
  }
  const groupId = dom.eventGroup.value;
  if (!groupId) {
    dom.eventUpcomingCount.textContent = t("events.upcomingCountUnknown");
    return;
  }
  const groupName = getGroupName(groupId);
  const count = getHourlyCount(groupId);
  state.event.upcomingCount = count;
  dom.eventUpcomingCount.textContent = t("events.upcomingCountStatus", {
    group: groupName || t("events.upcomingCountGroupFallback"),
    count,
    limit: EVENT_HOURLY_LIMIT
  });
  scheduleHourlyCountUpdate(groupId);
}

export async function refreshUpcomingEventCount(api, options = {}) {
  const groupId = dom.eventGroup.value;
  if (!groupId) {
    state.event.upcomingCount = null;
    renderUpcomingEventCount();
    updateEventCreateDisabled();
    return null;
  }
  const useServer = options.useServer !== false;
  if (useServer && api?.listGroupEvents) {
    try {
      const events = await api.listGroupEvents({
        groupId,
        upcomingOnly: true,
        includeNonEditable: true
      });
      // Store server count for cross-platform detection (not for display)
      updateServerHourlyCount(events);
    } catch (err) {
      // Ignore list failures and keep local history.
    }
  }
  const count = getHourlyCount(groupId);
  state.event.upcomingCount = count;
  renderUpcomingEventCount();
  updateEventCreateDisabled();
  return count;
}

export function renderUpcomingEventCountLabel() {
  renderUpcomingEventCount();
}

export function updateDateMode(profile) {
  const mode = profile?.dateMode || "manual";
  const hasPatterns = Boolean(profile?.patterns && profile.patterns.length);
  let defaultSource = "manual";
  if (hasPatterns && (mode === "pattern" || mode === "both")) {
    defaultSource = "pattern";
  }
  state.event.dateSource = defaultSource;
  const radios = dom.eventDateSource.querySelectorAll("input[name='date-source']");
  radios.forEach(radio => {
    if (!profile || mode === "manual" || !hasPatterns) {
      radio.checked = radio.value === "manual";
      radio.disabled = radio.value !== "manual";
    } else if (mode === "pattern") {
      radio.checked = radio.value === "pattern";
      radio.disabled = radio.value !== "pattern";
    } else {
      radio.checked = radio.value === defaultSource;
      radio.disabled = false;
    }
  });
  syncDateInputs();
}

export function syncDateInputs() {
  const usePattern = state.event.dateSource === "pattern";
  dom.eventDateOption.disabled = !usePattern;
  dom.eventManualDate.disabled = usePattern;
  dom.eventManualTime.disabled = usePattern;
  if (dom.eventPatternDates) {
    dom.eventPatternDates.hidden = !usePattern;
  }
  if (dom.eventManualFields) {
    dom.eventManualFields.hidden = usePattern;
  }
  dom.eventTimezone.disabled = false;
  dom.eventDuration.disabled = false;
}

export async function updateDateOptions(api, profile) {
  if (!profile) {
    dom.eventDateOption.innerHTML = "";
    dom.eventDateOption.size = 1;
    dom.eventDateHint.textContent = t("events.dateHints.noProfile");
    return { success: true };
  }
  const hasPatterns = Boolean(profile.patterns && profile.patterns.length);
  if (!hasPatterns || profile.dateMode === "manual") {
    dom.eventDateOption.innerHTML = "";
    dom.eventDateOption.size = 1;
    dom.eventDateHint.textContent = t("events.dateHints.manualReady");
    return { success: true };
  }
  try {
    const selectedTimezone = dom.eventTimezone?.value || profile.timezone || buildTimezones().systemTz;
    const options = await api.getDateOptions({
      patterns: profile.patterns,
      monthsAhead: 6,
      timezone: selectedTimezone
    });
    state.event.dateOptions = options || [];
    const locale = getCurrentLanguage();
    renderSelect(dom.eventDateOption, state.event.dateOptions.map(opt => ({
      label: formatPatternDateLabel(opt, locale, selectedTimezone),
      value: opt.iso
    })), t("events.dateOption"));
    dom.eventDateOption.size = 1;
    dom.eventDateHint.textContent = options.length
      ? t("events.dateHints.chooseGenerated")
      : t("events.dateHints.noUpcoming");
    return { success: true };
  } catch (err) {
    dom.eventDateHint.textContent = t("events.dateHints.loadFailed");
    return { success: false, message: "Failed to build date options." };
  }
}

export function applyManualEventDefaults(options = {}) {
  state.event.profile = null;
  dom.eventProfileClear.disabled = true;
  if (!options.preserve) {
    dom.eventName.value = "";
    dom.eventDescription.value = "";
    dom.eventCategory.value = "hangout";
    if (state.event.tagInput) {
      state.event.tagInput.clear();
    } else {
      dom.eventTags.value = "";
    }
    dom.eventAccess.value = "public";
    enforceGroupAccess(dom.eventAccess, dom.eventGroup.value);
    dom.eventImageId.value = "";
    dom.eventSendNotification.checked = true;
    dom.eventDuration.value = formatDuration(120);
    updateEventDurationPreview();
    const { systemTz } = buildTimezones();
    ensureTimezoneOption(dom.eventTimezone, systemTz);
    dom.eventTimezone.value = systemTz;
    state.event.languages = ["eng"];
    state.event.platforms = ["standalonewindows", "android"];
    state.event.roleIds = [];
    renderEventLanguageList();
    renderEventPlatformList();
  }
  updateDateMode(null);
  updateDateOptions(null, null);
}

export async function renderEventRoleRestrictions(api) {
  if (!dom.eventRoleRestrictions || !dom.eventRoleList) {
    return;
  }
  const groupId = dom.eventGroup.value;
  const isGroupAccess = dom.eventAccess.value === "group";
  const shouldShow = Boolean(groupId) && isGroupAccess;
  dom.eventRoleRestrictions.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    dom.eventRoleList.innerHTML = "";
    return;
  }
  const labels = getRoleLabels();
  const requestId = ++roleFetchToken;
  dom.eventRoleList.innerHTML = `<div class="hint">${t("common.loading")}</div>`;
  try {
    const roles = await fetchGroupRoles(api, groupId);
    if (requestId !== roleFetchToken) {
      return;
    }
    const validIds = new Set(roles.map(role => role.id));
    state.event.roleIds = (state.event.roleIds || []).filter(id => validIds.has(id));
    renderRoleList({
      container: dom.eventRoleList,
      roles,
      selectedIds: state.event.roleIds,
      labels,
      onChange: next => {
        state.event.roleIds = next;
      }
    });
  } catch (err) {
    dom.eventRoleList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = labels.noRoles;
    dom.eventRoleList.appendChild(empty);
  }
}

export function handleEventAccessChange(api) {
  enforceGroupAccess(dom.eventAccess, dom.eventGroup.value);
  void renderEventRoleRestrictions(api);
}

export async function handleEventGroupChange(api) {
  state.event.selectedGroupId = dom.eventGroup.value;
  renderEventProfileOptions(api);
  enforceGroupAccess(dom.eventAccess, dom.eventGroup.value);
  void renderEventRoleRestrictions(api);
  await refreshUpcomingEventCount(api);
}

export function handleEventProfileChange(api) {
  const groupId = dom.eventGroup.value;
  const profileKey = dom.eventProfile.value;
  if (!groupId) {
    return;
  }
  if (!profileKey || profileKey === "__manual__") {
    state.event.selectedProfileKey = null;
    dom.eventProfileClear.disabled = true;
    applyManualEventDefaults({ preserve: true });
    enforceGroupAccess(dom.eventAccess, groupId);
    void renderEventRoleRestrictions(api);
    return;
  }
  state.event.selectedProfileKey = profileKey;
  dom.eventProfileClear.disabled = false;
  applyProfileToEventForm(groupId, profileKey, api);
}

export function handleDateSourceChange(event) {
  if (!event.target.value) {
    return;
  }
  state.event.dateSource = event.target.value;
  syncDateInputs();
}

export async function handleEventCreate(api) {
  if (state.app?.updateAvailable) {
    const message = t("events.updateRequired");
    showToast(message, true, { duration: 8000 });
    return { success: false, message, toastShown: true };
  }
  const groupId = dom.eventGroup.value;
  const profileKey = dom.eventProfile.value;
  const profile = profileKey && profileKey !== "__manual__"
    ? state.profiles?.[groupId]?.profiles?.[profileKey]
    : null;
  if (!groupId) {
    return { success: false, message: t("events.selectGroupError") };
  }
  enforceGroupAccess(dom.eventAccess, groupId);
  if (getCreateBlockRemainingMs(groupId) > 0) {
    const message = t("events.upcomingLimitReached");
    showToast(message, true, { duration: 8000 });
    return { success: false, message, toastShown: true };
  }
  if (state.event.tagInput) {
    state.event.tagInput.commit();
  }
  const tags = state.event.tagInput
    ? state.event.tagInput.getTags()
    : enforceTagsInput(dom.eventTags, TAG_LIMIT, true);
  const dateSource = state.event.dateSource;
  let selectedDateIso = null;
  let manualDate = null;
  let manualTime = null;
  if (dateSource === "pattern") {
    if (!profile) {
      return { success: false, message: "Select a profile with patterns or use manual date/time." };
    }
    selectedDateIso = dom.eventDateOption.value;
    if (!selectedDateIso) {
      return { success: false, message: t("events.selectDateError") };
    }
    // Validate pattern date is not in the past
    const patternDateTime = new Date(selectedDateIso);
    if (patternDateTime < new Date()) {
      return { success: false, message: "Cannot create event in the past. Selected time has already passed." };
    }
  } else {
    manualDate = dom.eventManualDate.value;
    manualTime = dom.eventManualTime.value;
    if (!manualDate || !manualTime) {
      return { success: false, message: t("events.selectDateError") };
    }
    const maxDate = getMaxEventDateString();
    if (manualDate > maxDate) {
      return { success: false, message: t("events.futureDateError") };
    }
    // Validate manual date/time is not in the past
    const manualDateTime = new Date(`${manualDate}T${manualTime}`);
    const now = new Date();
    if (manualDateTime < now) {
      return { success: false, message: "Cannot create event in the past. Selected time has already passed." };
    }
  }
  let durationMinutes = parseDurationInput(dom.eventDuration.value)?.minutes ?? null;
  if (!durationMinutes) {
    const fallback = typeof profile?.duration === "number" ? profile.duration : 120;
    durationMinutes = normalizeDurationInput(dom.eventDuration, fallback);
    updateEventDurationPreview();
  }
  if (!durationMinutes || durationMinutes < 1) {
    return { success: false, message: "Duration must be a positive number." };
  }
  const timezone = dom.eventTimezone.value || profile?.timezone || buildTimezones().systemTz;
  const title = sanitizeText(dom.eventName.value, {
    maxLength: EVENT_NAME_LIMIT,
    allowNewlines: false,
    trim: true
  });
  dom.eventName.value = title;
  const description = sanitizeText(dom.eventDescription.value, {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  dom.eventDescription.value = description;
  const eventData = {
    title,
    description,
    category: dom.eventCategory.value,
    accessType: dom.eventAccess.value,
    languages: state.event.languages.slice(),
    platforms: state.event.platforms.slice(),
    tags,
    imageId: dom.eventImageId.value.trim() || null,
    sendCreationNotification: Boolean(dom.eventSendNotification.checked)
  };
  if (eventData.accessType === "group") {
    eventData.roleIds = (state.event.roleIds || []).filter(id => typeof id === "string" && id.trim());
  }
  if (eventData.languages.length > 3) {
    return { success: false, message: "Maximum 3 languages allowed." };
  }
  if (!eventData.title) {
    return { success: false, message: t("events.requiredSingle", { field: t("events.eventName") }) };
  }
  if (!eventData.description) {
    return { success: false, message: t("events.requiredSingle", { field: t("events.description") }) };
  }
  state.event.createInProgress = true;
  updateEventCreateDisabled();
  try {
    const prep = await api.prepareEvent({
      groupId,
      timezone,
      durationMinutes,
      selectedDateIso,
      manualDate,
      manualTime
    });
    if (prep.conflictEvent && !state.session.skipConflictWarning) {
      const conflictResult = await showConflictModal(prep.conflictEvent.title);
      if (!conflictResult.continue) {
        state.event.createInProgress = false;
        updateEventCreateDisabled();
        if (conflictResult.changeTime) {
          // Navigate back to date selection step (step index 1)
          const wizard = getEventWizard();
          if (wizard) {
            wizard.goTo(1);
          }
        }
        return { success: false, message: t("events.failed") };
      }
    }
    const result = await api.createEvent({
      groupId,
      startsAtUtc: prep.startsAtUtc,
      endsAtUtc: prep.endsAtUtc,
      eventData
    });
    if (!result?.ok) {
      if (isRateLimitError(result?.error)) {
        state.event.createInProgress = false;
        const rateLimitInfo = handleCreateRateLimit(groupId);
        updateEventCreateDisabled();
        const message = getRateLimitMessage(rateLimitInfo);
        showToast(message, true, { duration: 8000 });
        return { success: false, message, toastShown: true };
      }
      state.event.createInProgress = false;
      updateEventCreateDisabled();
      return { success: false, message: result?.error?.message || "Could not create event." };
    }
    clearRateLimit(getCreateRateLimitKey(groupId));
    clearHourlyLimit(groupId);
    resetBackoff();
    recordHourlyEvent(groupId, Date.now(), result.eventId);
    state.event.createInProgress = false;
    updateEventCreateDisabled();
    const count = await refreshUpcomingEventCount(api, { useServer: false });
    const groupName = getGroupName(groupId) || t("events.upcomingCountGroupFallback");
    const message = typeof count === "number"
      ? t("events.upcomingCountToast", { group: groupName, count, limit: EVENT_HOURLY_LIMIT })
      : t("events.created");
    return { success: true, message };
  } catch (err) {
    if (isRateLimitError(err)) {
      state.event.createInProgress = false;
      const rateLimitInfo = handleCreateRateLimit(groupId);
      updateEventCreateDisabled();
      const message = getRateLimitMessage(rateLimitInfo);
      showToast(message, true, { duration: 8000 });
      return { success: false, message, toastShown: true };
    }
    state.event.createInProgress = false;
    updateEventCreateDisabled();
    return { success: false, message: err?.message || "Could not create event." };
  }
}

export function renderEventProfileOptions(api) {
  const groupId = dom.eventGroup.value || state.event.selectedGroupId;
  if (!groupId) {
    dom.eventProfile.innerHTML = "";
    state.event.selectedProfileKey = null;
    applyManualEventDefaults({ preserve: true });
    return;
  }
  const profiles = state.profiles[groupId]?.profiles || {};
  const profileKeys = Object.keys(profiles);
  const options = [
    { label: t("events.manualProfileOption"), value: "__manual__" },
    ...profileKeys.map(key => ({
      label: getProfileLabel(key, profiles[key]),
      value: key
    }))
  ];
  renderSelect(dom.eventProfile, options);
  const current = state.event.selectedProfileKey;
  const nextValue = current && profileKeys.includes(current) ? current : "__manual__";
  dom.eventProfile.value = nextValue;
  dom.eventProfileClear.disabled = nextValue === "__manual__";
  if (nextValue === "__manual__") {
    state.event.selectedProfileKey = null;
    applyManualEventDefaults({ preserve: true });
  } else {
    state.event.selectedProfileKey = nextValue;
    applyProfileToEventForm(groupId, nextValue, api);
  }
}

export function renderEventLanguageList() {
  renderChecklist(dom.eventLanguageList, LANGUAGES, state.event.languages, {
    max: 3,
    filterText: dom.eventLanguageFilter.value,
    getLabel: item => getLanguageDisplayName(item.value, item.label),
    onChange: next => {
      state.event.languages = next;
      renderEventLanguageList();
      dom.eventLanguageHint.textContent = t("events.languagesHint", { count: next.length });
    }
  });
  dom.eventLanguageHint.textContent = t("events.languagesHint", { count: state.event.languages.length });
}

export function renderEventPlatformList() {
  renderChecklist(dom.eventPlatformList, PLATFORMS, state.event.platforms, {
    onChange: next => {
      state.event.platforms = next;
      renderEventPlatformList();
    }
  });
}

export function applyProfileToEventForm(groupId, profileKey, api) {
  const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
  if (!profile) {
    return;
  }
  state.event.profile = profile;
  dom.eventName.value = profile.name || "";
  dom.eventDescription.value = profile.description || "";
  dom.eventCategory.value = profile.category || "hangout";
  if (state.event.tagInput) {
    state.event.tagInput.setTags(profile.tags || []);
  } else {
    dom.eventTags.value = (profile.tags || []).join(", ");
  }
  dom.eventAccess.value = profile.accessType || "public";
  enforceGroupAccess(dom.eventAccess, groupId);
  state.event.roleIds = Array.isArray(profile.roleIds) ? profile.roleIds.slice() : [];
  dom.eventImageId.value = profile.imageId || "";
  dom.eventSendNotification.checked = Boolean(profile.sendNotification);
  dom.eventDuration.value = formatDuration(profile.duration || 120);
  updateEventDurationPreview();
  const timezone = profile.timezone || buildTimezones().systemTz;
  ensureTimezoneOption(dom.eventTimezone, timezone);
  dom.eventTimezone.value = timezone;
  state.event.languages = profile.languages ? profile.languages.slice() : [];
  state.event.platforms = profile.platforms ? profile.platforms.slice() : [];
  renderEventLanguageList();
  renderEventPlatformList();
  updateDateMode(profile);
  updateDateOptions(api, profile);
  void renderEventRoleRestrictions(api);
}

function getProfileLabel(profileKey, profile) {
  const label = (profile?.displayName || "").trim();
  return label || profileKey;
}

// Bind conflict modal event handlers
if (dom.conflictContinue) {
  dom.conflictContinue.addEventListener("click", handleConflictContinue);
}
if (dom.conflictChangeTime) {
  dom.conflictChangeTime.addEventListener("click", handleConflictChangeTime);
}
