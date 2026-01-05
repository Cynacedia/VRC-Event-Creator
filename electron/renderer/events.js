import { dom, state } from "./state.js";
import { showToast, renderSelect, renderChecklist } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, formatDurationPreview, enforceGroupAccess, getMaxEventDateString } from "./utils.js";
import { EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, LANGUAGES, PLATFORMS, TAG_LIMIT } from "./config.js";
import { t, getCurrentLanguage, getLanguageDisplayName } from "./i18n/index.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

const UPCOMING_EVENT_LIMIT = 10;
let roleFetchToken = 0;

function getRoleLabels() {
  return {
    allAccess: t("events.roleRestrictions.allAccess"),
    managementRoles: t("events.roleRestrictions.managementRoles"),
    roles: t("events.roleRestrictions.roles"),
    noRoles: t("events.roleRestrictions.noRoles")
  };
}

function updateEventCreateDisabled() {
  dom.eventCreate.disabled = !state.user
    || state.event.createBlocked
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
  if (dom.eventCountRefresh) {
    dom.eventCountRefresh.disabled = !state.user || !dom.eventGroup.value;
  }
  const groupName = getGroupName(dom.eventGroup.value);
  const limit = state.event.upcomingLimit || UPCOMING_EVENT_LIMIT;
  if (typeof state.event.upcomingCount === "number") {
    dom.eventUpcomingCount.textContent = t("events.upcomingCountStatus", {
      group: groupName || t("events.upcomingCountGroupFallback"),
      count: state.event.upcomingCount,
      limit
    });
    return;
  }
  dom.eventUpcomingCount.textContent = t("events.upcomingCountUnknown");
}

export async function refreshUpcomingEventCount(api, options = {}) {
  if (!api?.getUpcomingEventCount || !dom.eventGroup) {
    state.event.upcomingCount = null;
    state.event.createBlocked = false;
    renderUpcomingEventCount();
    updateEventCreateDisabled();
    return null;
  }
  const groupId = dom.eventGroup.value;
  if (!groupId) {
    state.event.upcomingCount = null;
    state.event.createBlocked = false;
    renderUpcomingEventCount();
    updateEventCreateDisabled();
    return null;
  }
  if (options.skipFetch) {
    renderUpcomingEventCount();
    return state.event.upcomingCount;
  }
  try {
    const result = await api.getUpcomingEventCount({ groupId });
    const nextCount = Number(result?.count);
    const nextLimit = Number(result?.limit) || UPCOMING_EVENT_LIMIT;
    state.event.upcomingCount = Number.isFinite(nextCount) ? nextCount : null;
    state.event.upcomingLimit = nextLimit;
    if (Number.isFinite(nextCount)) {
      if (nextCount >= nextLimit) {
        state.event.createBlocked = true;
      } else if (options.allowUnblock !== false) {
        state.event.createBlocked = false;
      }
    } else if (options.allowUnblock !== false) {
      state.event.createBlocked = false;
    }
    renderUpcomingEventCount();
    updateEventCreateDisabled();
    return state.event.upcomingCount;
  } catch (err) {
    state.event.upcomingCount = null;
    renderUpcomingEventCount();
    return null;
  }
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
  if (state.event.createBlocked) {
    const limit = state.event.upcomingLimit || UPCOMING_EVENT_LIMIT;
    const groupName = getGroupName(groupId) || t("events.upcomingCountGroupFallback");
    const message = t("events.upcomingLimitReached", { group: groupName, limit });
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
    if (prep.conflictEvent) {
      const confirmCreate = window.confirm(
        `Existing event "${prep.conflictEvent.title}" is at this time. Continue anyway?`
      );
      if (!confirmCreate) {
        state.event.createInProgress = false;
        updateEventCreateDisabled();
        return { success: false, message: "Event creation cancelled." };
      }
    }
    const result = await api.createEvent({
      groupId,
      startsAtUtc: prep.startsAtUtc,
      endsAtUtc: prep.endsAtUtc,
      eventData
    });
    if (!result?.ok) {
      const status = result?.error?.status;
      if (status === 429 || result?.error?.code === "UPCOMING_LIMIT") {
        const limit = state.event.upcomingLimit || UPCOMING_EVENT_LIMIT;
        const groupName = getGroupName(groupId) || t("events.upcomingCountGroupFallback");
        state.event.createBlocked = true;
        state.event.createInProgress = false;
        updateEventCreateDisabled();
        showToast(t("events.upcomingLimitError", { group: groupName, limit }), true, { duration: 8000 });
        await refreshUpcomingEventCount(api, { allowUnblock: false });
        return { success: false, message: t("events.upcomingLimitError", { group: groupName, limit }), toastShown: true };
      }
      state.event.createInProgress = false;
      updateEventCreateDisabled();
      return { success: false, message: result?.error?.message || "Could not create event." };
    }
    state.event.createInProgress = false;
    updateEventCreateDisabled();
    const count = await refreshUpcomingEventCount(api);
    const groupName = getGroupName(groupId) || t("events.upcomingCountGroupFallback");
    const limit = state.event.upcomingLimit || UPCOMING_EVENT_LIMIT;
    const message = typeof count === "number"
      ? t("events.upcomingCountToast", { group: groupName, count, limit })
      : t("events.created");
    return { success: true, message };
  } catch (err) {
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
