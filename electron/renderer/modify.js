import { dom, state } from "./state.js";
import { renderSelect, renderChecklist, showToast } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, createTagInput, enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, sanitizeDurationInputValue, formatDurationPreview, enforceGroupAccess, getTodayDateString, getMaxEventDateString } from "./utils.js";
import { ACCESS_TYPES, CATEGORIES, EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, LANGUAGES, PLATFORMS, TAG_LIMIT } from "./config.js";
import { t, getLanguageDisplayName } from "./i18n/index.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

const HOLD_DURATION_MS = 2000;
let modifyApi = null;
let roleFetchToken = 0;

function getGroupName(groupId) {
  if (!groupId) {
    return "";
  }
  const group = state.groups.find(entry => entry.groupId === groupId || entry.id === groupId);
  return group?.name || "";
}

function getDurationUnits() {
  return {
    day: t("common.durationUnits.day"),
    hour: t("common.durationUnits.hour"),
    minute: t("common.durationUnits.minute")
  };
}

export function updateModifyDurationPreview() {
  if (!dom.modifyEventDurationPreview || !dom.modifyEventDuration) {
    return;
  }
  dom.modifyEventDurationPreview.textContent = formatDurationPreview(dom.modifyEventDuration.value, getDurationUnits());
}

function getRoleLabels() {
  return {
    allAccess: t("events.roleRestrictions.allAccess"),
    managementRoles: t("events.roleRestrictions.managementRoles"),
    roles: t("events.roleRestrictions.roles"),
    noRoles: t("events.roleRestrictions.noRoles")
  };
}

async function renderModifyRoleRestrictions() {
  if (!dom.modifyRoleRestrictions || !dom.modifyRoleList) {
    return;
  }
  const groupId = state.modify.selectedEvent?.groupId || dom.modifyGroup?.value;
  const isGroupAccess = dom.modifyEventAccess?.value === "group";
  const shouldShow = Boolean(groupId) && isGroupAccess;
  dom.modifyRoleRestrictions.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    dom.modifyRoleList.innerHTML = "";
    return;
  }
  const labels = getRoleLabels();
  const requestId = ++roleFetchToken;
  dom.modifyRoleList.innerHTML = `<div class="hint">${t("common.loading")}</div>`;
  try {
    const roles = await fetchGroupRoles(modifyApi, groupId);
    if (requestId !== roleFetchToken) {
      return;
    }
    const validIds = new Set(roles.map(role => role.id));
    state.modify.roleIds = (state.modify.roleIds || []).filter(id => validIds.has(id));
    renderRoleList({
      container: dom.modifyRoleList,
      roles,
      selectedIds: state.modify.roleIds,
      labels,
      onChange: next => {
        state.modify.roleIds = next;
      }
    });
  } catch (err) {
    dom.modifyRoleList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = labels.noRoles;
    dom.modifyRoleList.appendChild(empty);
  }
}

function handleModifyAccessChange() {
  enforceGroupAccess(dom.modifyEventAccess, state.modify.selectedEvent?.groupId || dom.modifyGroup?.value);
  void renderModifyRoleRestrictions();
}

function getGroupBanner(groupId) {
  const group = state.groups.find(entry => entry.groupId === groupId || entry.id === groupId);
  if (!group) {
    return null;
  }
  return group.bannerUrl
    || group.bannerImageUrl
    || group.iconUrl
    || group.iconImageUrl
    || null;
}

function setModifyLoading(loading) {
  state.modify.loading = loading;
  if (dom.modifyRefresh) {
    dom.modifyRefresh.disabled = loading || !state.user;
  }
}

function formatDateParts(value, timeZone) {
  if (!value) {
    return { date: "", time: "" };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const lookup = (parts, type) => parts.find(part => part.type === type)?.value || "";
  const year = lookup(dateParts, "year");
  const month = lookup(dateParts, "month");
  const day = lookup(dateParts, "day");
  const hour = lookup(timeParts, "hour");
  const minute = lookup(timeParts, "minute");
  return {
    date: year && month && day ? `${year}-${month}-${day}` : "",
    time: hour && minute ? `${hour}:${minute}` : ""
  };
}

function formatEventDisplayDate(value) {
  if (!value) {
    return t("modify.dateUnknown");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t("modify.dateUnknown");
  }
  return date.toLocaleString();
}

function renderModifyCount() {
  if (!dom.modifyCount) {
    return;
  }
  const groupId = dom.modifyGroup?.value;
  if (!groupId) {
    dom.modifyCount.textContent = t("modify.countEmpty");
    return;
  }
  const groupName = getGroupName(groupId) || t("modify.countGroupFallback");
  dom.modifyCount.textContent = t("modify.countStatus", {
    group: groupName,
    count: state.modify.events.length
  });
}

function renderModifyEventGrid() {
  if (!dom.modifyEventGrid) {
    return;
  }
  dom.modifyEventGrid.innerHTML = "";
  if (state.modify.loading) {
    const loading = document.createElement("div");
    loading.className = "hint";
    loading.textContent = t("common.loading");
    dom.modifyEventGrid.appendChild(loading);
    return;
  }
  if (!state.modify.events.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = t("modify.empty");
    dom.modifyEventGrid.appendChild(empty);
    return;
  }
  state.modify.events.forEach(event => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.dataset.eventId = event.id;
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const thumb = document.createElement("div");
    thumb.className = "event-thumb";
    const imageUrl = event.imageUrl || getGroupBanner(event.groupId);
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = event.title || t("modify.eventImage");
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        const fallback = document.createElement("div");
        fallback.className = "event-thumb-placeholder";
        fallback.textContent = t("modify.noImage");
        thumb.appendChild(fallback);
      });
      thumb.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "event-thumb-placeholder";
      fallback.textContent = t("modify.noImage");
      thumb.appendChild(fallback);
    }

    const title = document.createElement("h4");
    title.className = "event-title";
    title.textContent = event.title || t("modify.untitled");

    const date = document.createElement("div");
    date.className = "event-date";
    date.textContent = formatEventDisplayDate(event.startsAtUtc || event.endsAtUtc);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "event-delete";
    deleteBtn.setAttribute("aria-label", t("modify.delete"));
    const deleteIcon = document.createElement("span");
    deleteIcon.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zm-6 0h2v9H8V9z"></path>
      </svg>
    `;
    deleteBtn.appendChild(deleteIcon);
    attachHoldToDelete(deleteBtn, () => handleDeleteEvent(event));

    card.appendChild(deleteBtn);
    card.appendChild(thumb);
    card.appendChild(title);
    card.appendChild(date);
    card.addEventListener("click", () => openModifyModal(event));
    card.addEventListener("keydown", evt => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        openModifyModal(event);
      }
    });
    dom.modifyEventGrid.appendChild(card);
  });
}

function renderModifyProfileOptions(groupId) {
  if (!dom.modifyProfile) {
    return;
  }
  dom.modifyProfile.value = "";
  if (!groupId) {
    dom.modifyProfile.innerHTML = "";
    return;
  }
  const profiles = state.profiles[groupId]?.profiles || {};
  const profileKeys = Object.keys(profiles);
  const options = [
    { label: t("modify.profileSelect"), value: "" },
    ...profileKeys.map(key => ({
      label: getProfileLabel(key, profiles[key]),
      value: `${groupId}::${key}`
    }))
  ];
  renderSelect(dom.modifyProfile, options);
}

function renderModifyLanguageList() {
  renderChecklist(dom.modifyLanguageList, LANGUAGES, state.modify.languages, {
    max: 3,
    filterText: dom.modifyLanguageFilter.value,
    getLabel: item => getLanguageDisplayName(item.value, item.label),
    onChange: next => {
      state.modify.languages = next;
      renderModifyLanguageList();
      dom.modifyLanguageHint.textContent = t("modify.languagesHint", { count: next.length });
    }
  });
  dom.modifyLanguageHint.textContent = t("modify.languagesHint", { count: state.modify.languages.length });
}

function renderModifyPlatformList() {
  renderChecklist(dom.modifyPlatformList, PLATFORMS, state.modify.platforms, {
    onChange: next => {
      state.modify.platforms = next;
      renderModifyPlatformList();
    }
  });
}

function applyModifyFormFromEvent(event) {
  if (!event) {
    return;
  }
  state.modify.selectedEvent = event;
  dom.modifyEventName.value = event.title || "";
  dom.modifyEventDescription.value = event.description || "";
  dom.modifyEventCategory.value = event.category || "hangout";
  if (state.modify.tagInput) {
    state.modify.tagInput.setTags(event.tags || []);
  } else {
    dom.modifyEventTags.value = (event.tags || []).join(", ");
  }
  dom.modifyEventAccess.value = event.accessType || "public";
  enforceGroupAccess(dom.modifyEventAccess, event.groupId);
  dom.modifyEventImageId.value = event.imageId || "";
  state.modify.roleIds = Array.isArray(event.roleIds) ? event.roleIds.slice() : [];
  const { systemTz } = buildTimezones();
  const timezone = event.timezone || systemTz;
  ensureTimezoneOption(dom.modifyEventTimezone, timezone);
  dom.modifyEventTimezone.value = timezone;
  const parts = formatDateParts(event.startsAtUtc || event.endsAtUtc, timezone);
  dom.modifyEventDate.value = parts.date;
  dom.modifyEventTime.value = parts.time;
  dom.modifyEventDuration.value = formatDuration(event.durationMinutes || 120);
  updateModifyDurationPreview();

  state.modify.languages = Array.isArray(event.languages) ? event.languages.slice() : [];
  state.modify.platforms = Array.isArray(event.platforms) ? event.platforms.slice() : [];
  renderModifyLanguageList();
  renderModifyPlatformList();
  renderModifyProfileOptions(event.groupId);
  void renderModifyRoleRestrictions();
}

function openModifyModal(event) {
  if (!dom.modifyOverlay || !event) {
    return;
  }
  if (state.app?.updateAvailable) {
    showToast(t("modify.updateRequired"), true, { duration: 8000 });
    return;
  }
  applyModifyFormFromEvent(event);
  dom.modifyOverlay.classList.remove("is-hidden");
}

function closeModifyModal() {
  if (!dom.modifyOverlay) {
    return;
  }
  dom.modifyOverlay.classList.add("is-hidden");
  state.modify.selectedEvent = null;
}

function applyProfileToModifyForm(profile) {
  if (!profile) {
    return;
  }
  dom.modifyEventName.value = profile.name || dom.modifyEventName.value;
  dom.modifyEventDescription.value = profile.description || dom.modifyEventDescription.value;
  dom.modifyEventCategory.value = profile.category || dom.modifyEventCategory.value || "hangout";
  if (state.modify.tagInput) {
    state.modify.tagInput.setTags(profile.tags || []);
  } else if (profile.tags) {
    dom.modifyEventTags.value = (profile.tags || []).join(", ");
  }
  dom.modifyEventAccess.value = profile.accessType || dom.modifyEventAccess.value || "public";
  enforceGroupAccess(dom.modifyEventAccess, groupId);
  dom.modifyEventImageId.value = profile.imageId || dom.modifyEventImageId.value;
  state.modify.roleIds = Array.isArray(profile.roleIds) ? profile.roleIds.slice() : state.modify.roleIds;
  if (profile.duration) {
    dom.modifyEventDuration.value = formatDuration(profile.duration);
    updateModifyDurationPreview();
  }
  if (profile.timezone) {
    ensureTimezoneOption(dom.modifyEventTimezone, profile.timezone);
    dom.modifyEventTimezone.value = profile.timezone;
  }
  state.modify.languages = Array.isArray(profile.languages) ? profile.languages.slice() : state.modify.languages;
  state.modify.platforms = Array.isArray(profile.platforms) ? profile.platforms.slice() : state.modify.platforms;
  renderModifyLanguageList();
  renderModifyPlatformList();
  void renderModifyRoleRestrictions();
}

function getProfileLabel(profileKey, profile) {
  const label = (profile?.displayName || "").trim();
  return label || profileKey;
}

function attachHoldToDelete(button, onConfirm) {
  let rafId = null;
  let holding = false;
  let startTime = 0;

  const reset = () => {
    holding = false;
    button.classList.remove("is-holding");
    button.style.setProperty("--hold-angle", "0deg");
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const tick = now => {
    if (!holding) {
      return;
    }
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / HOLD_DURATION_MS);
    button.style.setProperty("--hold-angle", `${progress * 360}deg`);
    if (progress >= 1) {
      reset();
      onConfirm();
      return;
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = event => {
    if (button.disabled) {
      return;
    }
    if (state.app?.updateAvailable) {
      showToast(t("modify.updateRequired"), true, { duration: 8000 });
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    holding = true;
    startTime = performance.now();
    button.classList.add("is-holding");
    if (typeof button.setPointerCapture === "function") {
      button.setPointerCapture(event.pointerId);
    }
    rafId = requestAnimationFrame(tick);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", reset);
  button.addEventListener("pointerleave", reset);
  button.addEventListener("pointercancel", reset);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
  });
}

async function handleDeleteEvent(event) {
  if (!modifyApi?.deleteEvent) {
    showToast(t("modify.deleteFailed"), true);
    return;
  }
  if (!event?.groupId || !event?.id) {
    showToast(t("modify.deleteFailed"), true);
    return;
  }
  const result = await modifyApi.deleteEvent({ groupId: event.groupId, eventId: event.id });
  if (!result?.ok) {
    showToast(result?.error?.message || t("modify.deleteFailed"), true);
    return;
  }
  showToast(t("modify.deleted"));
  await refreshModifyEvents(modifyApi, { preserveSelection: true });
}

async function handleModifySave() {
  if (!modifyApi?.updateEvent) {
    showToast(t("modify.saveFailed"), true);
    return;
  }
  if (state.app?.updateAvailable) {
    showToast(t("modify.updateRequired"), true, { duration: 8000 });
    return;
  }
  const event = state.modify.selectedEvent;
  if (!event?.groupId || !event?.id) {
    showToast(t("modify.selectEventError"), true);
    return;
  }
  enforceGroupAccess(dom.modifyEventAccess, event.groupId);
  if (state.modify.saving) {
    return;
  }
  if (state.modify.tagInput) {
    state.modify.tagInput.commit();
  }
  const tags = state.modify.tagInput
    ? state.modify.tagInput.getTags()
    : enforceTagsInput(dom.modifyEventTags, TAG_LIMIT, true);
  const title = sanitizeText(dom.modifyEventName.value, {
    maxLength: EVENT_NAME_LIMIT,
    allowNewlines: false,
    trim: true
  });
  dom.modifyEventName.value = title;
  const description = sanitizeText(dom.modifyEventDescription.value, {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  dom.modifyEventDescription.value = description;
  if (!title) {
    showToast(t("modify.requiredSingle", { field: t("modify.eventName") }), true);
    return;
  }
  if (!description) {
    showToast(t("modify.requiredSingle", { field: t("modify.description") }), true);
    return;
  }
  const manualDate = dom.modifyEventDate.value;
  const manualTime = dom.modifyEventTime.value;
  if (!manualDate || !manualTime) {
    showToast(t("modify.selectDateError"), true);
    return;
  }
  const today = getTodayDateString();
  if (manualDate < today) {
    showToast(t("events.pastDateError"), true);
    return;
  }
  const maxDate = getMaxEventDateString();
  if (manualDate > maxDate) {
    showToast(t("events.futureDateError"), true);
    return;
  }
  let durationMinutes = parseDurationInput(dom.modifyEventDuration.value)?.minutes ?? null;
  if (!durationMinutes) {
    durationMinutes = normalizeDurationInput(dom.modifyEventDuration, 120);
  }
  if (!durationMinutes || durationMinutes < 1) {
    showToast(t("modify.durationError"), true);
    return;
  }
  if (state.modify.languages.length > 3) {
    showToast(t("modify.maxLanguages"), true);
    return;
  }
  state.modify.saving = true;
  dom.modifySave.disabled = true;

    const eventData = {
      title,
      description,
      category: dom.modifyEventCategory.value,
      accessType: dom.modifyEventAccess.value,
      languages: state.modify.languages.slice(),
      platforms: state.modify.platforms.slice(),
      tags,
      imageId: dom.modifyEventImageId.value.trim() || null,
      roleIds: dom.modifyEventAccess.value === "group" ? state.modify.roleIds.slice() : []
    };
  try {
    const result = await modifyApi.updateEvent({
      groupId: event.groupId,
      eventId: event.id,
      eventData,
      timezone: dom.modifyEventTimezone.value,
      durationMinutes,
      manualDate,
      manualTime
    });
    if (!result?.ok) {
      showToast(result?.error?.message || t("modify.saveFailed"), true);
      return;
    }
    showToast(t("modify.saved"));
    closeModifyModal();
    await refreshModifyEvents(modifyApi, { preserveSelection: true });
  } finally {
    state.modify.saving = false;
    dom.modifySave.disabled = false;
  }
}

function handleProfileLoad() {
  const value = dom.modifyProfile.value;
  if (!value) {
    showToast(t("modify.profileSelectError"), true);
    return;
  }
  const [groupId, profileKey] = value.split("::");
  const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
  if (!profile) {
    showToast(t("modify.profileLoadFailed"), true);
    return;
  }
  applyProfileToModifyForm(profile);
  showToast(t("modify.profileLoaded"));
}

export async function refreshModifyEvents(api, options = {}) {
  if (api) {
    modifyApi = api;
  }
  if (!modifyApi?.listGroupEvents || !dom.modifyGroup) {
    state.modify.events = [];
    renderModifyEventGrid();
    renderModifyCount();
    return;
  }
  const groupId = dom.modifyGroup.value;
  if (!groupId) {
    state.modify.events = [];
    renderModifyEventGrid();
    renderModifyCount();
    return;
  }
  if (state.modify.loading) {
    return;
  }
  state.modify.selectedGroupId = groupId;
  setModifyLoading(true);
  renderModifyEventGrid();
  try {
    const events = await modifyApi.listGroupEvents({ groupId, upcomingOnly: true });
    state.modify.events = Array.isArray(events) ? events : [];
  } catch (err) {
    showToast(t("modify.loadFailed"), true);
    state.modify.events = [];
  } finally {
    setModifyLoading(false);
    renderModifyEventGrid();
    renderModifyCount();
  }
}

export function initModifyEvents(api) {
  if (api) {
    modifyApi = api;
  }
  if (!dom.modifyEventGrid) {
    return;
  }
  dom.modifyRefresh.addEventListener("click", () => { void refreshModifyEvents(modifyApi); });
  dom.modifyGroup.addEventListener("change", () => { void refreshModifyEvents(modifyApi); });
  if (dom.modifyClose) {
    dom.modifyClose.addEventListener("click", closeModifyModal);
  }
  if (dom.modifyCancel) {
    dom.modifyCancel.addEventListener("click", closeModifyModal);
  }
  if (dom.modifyOverlay) {
    dom.modifyOverlay.addEventListener("click", event => {
      if (event.target === dom.modifyOverlay) {
        closeModifyModal();
      }
    });
  }
  if (dom.modifySave) {
    dom.modifySave.addEventListener("click", handleModifySave);
  }
  if (dom.modifyProfileLoad) {
    dom.modifyProfileLoad.addEventListener("click", handleProfileLoad);
  }
  if (dom.modifyLanguageFilter) {
    dom.modifyLanguageFilter.addEventListener("input", renderModifyLanguageList);
  }
  if (dom.modifyEventDate) {
    const today = getTodayDateString();
    const maxDate = getMaxEventDateString();
    dom.modifyEventDate.min = today;
    dom.modifyEventDate.max = maxDate;
    dom.modifyEventDate.addEventListener("blur", () => {
      const selectedDate = dom.modifyEventDate.value;
      if (!selectedDate) {
        return;
      }
      const currentToday = getTodayDateString();
      const currentMax = getMaxEventDateString();
      if (selectedDate < currentToday) {
        showToast(t("events.pastDateError"), true);
        dom.modifyEventDate.value = currentToday;
      } else if (selectedDate > currentMax) {
        showToast(t("events.futureDateError"), true);
        dom.modifyEventDate.value = currentMax;
      }
    });
  }
  if (dom.modifyEventAccess) {
    dom.modifyEventAccess.addEventListener("change", handleModifyAccessChange);
  }
  if (dom.modifyEventDuration) {
    dom.modifyEventDuration.addEventListener("input", () => {
      dom.modifyEventDuration.value = sanitizeDurationInputValue(dom.modifyEventDuration.value);
      updateModifyDurationPreview();
    });
    dom.modifyEventDuration.addEventListener("blur", () => {
      normalizeDurationInput(dom.modifyEventDuration, 120);
      updateModifyDurationPreview();
    });
  }
  state.modify.tagInput = createTagInput({
    inputEl: dom.modifyEventTags,
    chipContainer: dom.modifyTagsChips,
    wrapperEl: dom.modifyTagsInput,
    maxTags: TAG_LIMIT
  });
  renderModifyLanguageList();
  renderModifyPlatformList();
}

export function syncModifyLocalization() {
  renderModifyLanguageList();
  renderModifyPlatformList();
  renderModifyCount();
  renderModifyEventGrid();
  void renderModifyRoleRestrictions();
}

export function initModifySelects() {
  if (!dom.modifyEventCategory || !dom.modifyEventAccess || !dom.modifyEventTimezone) {
    return;
  }
  renderSelect(dom.modifyEventCategory, CATEGORIES);
  renderSelect(dom.modifyEventAccess, ACCESS_TYPES);
  const { list, systemTz } = buildTimezones();
  renderSelect(dom.modifyEventTimezone, list);
  dom.modifyEventTimezone.value = systemTz;
}
