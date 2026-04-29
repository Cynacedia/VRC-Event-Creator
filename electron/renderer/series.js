import { dom, state } from "./state.js";
import { showToast, renderSelect, renderChecklist } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, enforceTagsInput, sanitizeText, formatDuration, parseDurationInput, formatDurationPreview, enforceGroupAccess } from "./utils.js";
import { CATEGORIES, ACCESS_TYPES, LANGUAGES, PLATFORMS, TAG_LIMIT, EVENT_NAME_LIMIT, EVENT_DESCRIPTION_LIMIT } from "./config.js";
import { t, getLanguageDisplayName } from "./i18n/index.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

let _seriesApi = null;
let roleFetchToken = 0;

export function initSeriesModule(api) {
  _seriesApi = api;
}

// --- Helpers for dropdown population ---

export function populateSeriesCategoryDropdown() {
  if (!dom.seriesCategory) return;
  renderSelect(dom.seriesCategory, CATEGORIES.map(c => ({ label: t(c.labelKey) || c.label, value: c.value })));
  dom.seriesCategory.value = "hangout";
}

export function populateSeriesAccessDropdown() {
  if (!dom.seriesAccess) return;
  renderSelect(dom.seriesAccess, ACCESS_TYPES.map(a => ({ label: t(a.labelKey) || a.label, value: a.value })));
  dom.seriesAccess.value = "public";
}

export function populateSeriesTimezoneDropdown() {
  if (!dom.seriesTimezone) return;
  const { systemTz, list } = buildTimezones();
  renderSelect(dom.seriesTimezone, list);
  ensureTimezoneOption(dom.seriesTimezone, systemTz);
  dom.seriesTimezone.value = systemTz;
}

// --- IPC + state ---

export async function loadSeriesForGroup(groupId) {
  if (!_seriesApi || !groupId) return {};
  try {
    const result = await _seriesApi.seriesList({ groupId });
    state.series[groupId] = result || {};
    return state.series[groupId];
  } catch (err) {
    console.error("Failed to load series:", err);
    state.series[groupId] = {};
    return {};
  }
}

// --- Editor state management ---

export function resetSeriesEditor() {
  state.schedules.editingSeriesId = null;
  if (dom.seriesLabel) dom.seriesLabel.value = "";
  if (dom.seriesTitle) dom.seriesTitle.value = "";
  if (dom.seriesDescription) dom.seriesDescription.value = "";
  if (dom.seriesCategory) dom.seriesCategory.value = "hangout";
  if (dom.seriesImageId) dom.seriesImageId.value = "";
  if (dom.seriesAccess) dom.seriesAccess.value = "public";
  if (dom.seriesTags) dom.seriesTags.value = "";
  if (state.schedules.seriesForm.tagInput) state.schedules.seriesForm.tagInput.clear();
  state.schedules.seriesForm.languages = ["eng"];
  state.schedules.seriesForm.platforms = ["standalonewindows", "android"];
  state.schedules.seriesForm.roleIds = [];
  if (dom.seriesDuration) {
    dom.seriesDuration.value = formatDuration(120);
    updateSeriesDurationPreview();
  }
  // Default start: tomorrow at the next round hour, in user's local timezone
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);
  if (dom.seriesStartDate) {
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    dom.seriesStartDate.value = `${yyyy}-${mm}-${dd}`;
  }
  if (dom.seriesStartTime) {
    dom.seriesStartTime.value = "20:00";
  }
  if (dom.seriesFrequency) dom.seriesFrequency.value = "weekly";
  if (dom.seriesInterval) dom.seriesInterval.value = "1";
  // Clear day-of-week checkboxes
  document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  if (dom.seriesEndAfterOccurrences) dom.seriesEndAfterOccurrences.checked = true;
  if (dom.seriesEndAfterDate) dom.seriesEndAfterDate.checked = false;
  if (dom.seriesEndCount) dom.seriesEndCount.value = "10";
  if (dom.seriesEndDate) dom.seriesEndDate.value = "";
  if (dom.seriesModificationWarning) {
    dom.seriesModificationWarning.classList.add("is-hidden");
    dom.seriesModificationWarning.textContent = "";
  }
  renderSeriesLanguageList();
  renderSeriesPlatformList();
  updateSeriesFrequencyVisibility();
  populateSeriesTimezoneDropdown();
  populateSeriesCategoryDropdown();
  populateSeriesAccessDropdown();
}

export function applySeriesToEditor(seriesData) {
  if (!seriesData) return;
  state.schedules.editingSeriesId = seriesData.seriesId;
  if (dom.seriesLabel) dom.seriesLabel.value = seriesData.label || "";
  const tpl = seriesData.eventTemplate || {};
  if (dom.seriesTitle) dom.seriesTitle.value = tpl.title || "";
  if (dom.seriesDescription) dom.seriesDescription.value = tpl.description || "";
  populateSeriesCategoryDropdown();
  if (dom.seriesCategory) dom.seriesCategory.value = tpl.category || "hangout";
  if (dom.seriesImageId) dom.seriesImageId.value = tpl.imageId || "";
  populateSeriesAccessDropdown();
  if (dom.seriesAccess) dom.seriesAccess.value = tpl.accessType || "public";
  state.schedules.seriesForm.languages = Array.isArray(tpl.languages) ? [...tpl.languages] : ["eng"];
  state.schedules.seriesForm.platforms = Array.isArray(tpl.platforms) ? [...tpl.platforms] : ["standalonewindows", "android"];
  state.schedules.seriesForm.roleIds = Array.isArray(tpl.roleIds) ? [...tpl.roleIds] : [];
  if (state.schedules.seriesForm.tagInput) {
    state.schedules.seriesForm.tagInput.setTags(Array.isArray(tpl.tags) ? tpl.tags : []);
  }
  if (dom.seriesDuration) {
    dom.seriesDuration.value = formatDuration(tpl.duration || 120);
    updateSeriesDurationPreview();
  }
  // Recurrence
  const rec = seriesData.recurrence || { frequency: "weekly", interval: 1 };
  populateSeriesTimezoneDropdown();
  if (dom.seriesTimezone && rec.timezone) {
    ensureTimezoneOption(dom.seriesTimezone, rec.timezone);
    dom.seriesTimezone.value = rec.timezone;
  }
  if (dom.seriesFrequency) dom.seriesFrequency.value = rec.frequency || "weekly";
  if (dom.seriesInterval) dom.seriesInterval.value = String(rec.interval || 1);
  // Days of week
  document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]').forEach(cb => {
    cb.checked = Array.isArray(rec.daysOfWeek) && rec.daysOfWeek.includes(cb.dataset.day);
  });
  // End condition
  const end = rec.end || { type: "afterOccurrences", count: 10 };
  if (end.type === "afterDate") {
    if (dom.seriesEndAfterDate) dom.seriesEndAfterDate.checked = true;
    if (dom.seriesEndAfterOccurrences) dom.seriesEndAfterOccurrences.checked = false;
    if (dom.seriesEndDate) dom.seriesEndDate.value = (end.date || "").slice(0, 10);
  } else {
    if (dom.seriesEndAfterOccurrences) dom.seriesEndAfterOccurrences.checked = true;
    if (dom.seriesEndAfterDate) dom.seriesEndAfterDate.checked = false;
    if (dom.seriesEndCount) dom.seriesEndCount.value = String(end.count || 10);
  }
  // Note: no startsAt is stored in our local series.json — we'd need to query VRChat for the first occurrence.
  // For now, leave the date inputs blank; the user can adjust if they want to update timing.
  if (dom.seriesStartDate) dom.seriesStartDate.value = "";
  if (dom.seriesStartTime) dom.seriesStartTime.value = "";
  if (dom.seriesModificationWarning) {
    dom.seriesModificationWarning.classList.add("is-hidden");
    dom.seriesModificationWarning.textContent = "";
  }
  renderSeriesLanguageList();
  renderSeriesPlatformList();
  updateSeriesFrequencyVisibility();
}

export function readSeriesEditor() {
  const label = sanitizeText(dom.seriesLabel?.value || "", { maxLength: 100, trim: true });
  const title = sanitizeText(dom.seriesTitle?.value || "", { maxLength: EVENT_NAME_LIMIT, trim: true });
  const description = sanitizeText(dom.seriesDescription?.value || "", {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  const tags = state.schedules.seriesForm.tagInput?.getTags() || [];
  const eventTemplate = {
    title,
    description,
    category: dom.seriesCategory?.value || "hangout",
    accessType: dom.seriesAccess?.value || "public",
    languages: state.schedules.seriesForm.languages.slice(),
    platforms: state.schedules.seriesForm.platforms.slice(),
    tags,
    imageId: dom.seriesImageId?.value.trim() || null,
    roleIds: dom.seriesAccess?.value === "group"
      ? state.schedules.seriesForm.roleIds.filter(id => typeof id === "string" && id.trim())
      : [],
    duration: parseDurationInput(dom.seriesDuration?.value || "00:02:00"),
    sendCreationNotification: false
  };

  // Recurrence
  const frequency = dom.seriesFrequency?.value || "weekly";
  const interval = Math.max(1, Math.min(366, parseInt(dom.seriesInterval?.value || "1", 10) || 1));
  const timezone = dom.seriesTimezone?.value || "UTC";
  const daysOfWeek = [];
  document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]:checked').forEach(cb => {
    daysOfWeek.push(cb.dataset.day);
  });
  let end;
  if (dom.seriesEndAfterDate?.checked) {
    const dateVal = dom.seriesEndDate?.value || "";
    end = { type: "afterDate", date: dateVal ? `${dateVal}T23:59:00` : "" };
  } else {
    const count = Math.max(1, Math.min(366, parseInt(dom.seriesEndCount?.value || "10", 10) || 10));
    end = { type: "afterOccurrences", count };
  }
  const recurrence = { frequency, interval, timezone };
  if (frequency === "weekly" && daysOfWeek.length) recurrence.daysOfWeek = daysOfWeek;
  if (end) recurrence.end = end;

  // Build startsAt and endsAt
  const startDate = dom.seriesStartDate?.value || "";
  const startTime = dom.seriesStartTime?.value || "20:00";
  let startsAtUtc = null;
  let endsAtUtc = null;
  if (startDate) {
    // Construct a Date in the user's selected timezone, then convert to UTC ISO
    // Use Luxon-style approach: build a string without offset, parse as local in chosen tz
    const localStr = `${startDate}T${startTime}:00`;
    try {
      const localDate = new Date(localStr);
      // Note: we can't easily target a specific IANA tz without Luxon here.
      // For now, treat the input as the user's local timezone (browser).
      // VRChat's recurrence object carries its own timezone, so the rule is correct.
      startsAtUtc = localDate.toISOString();
      const durationMs = (eventTemplate.duration || 120) * 60 * 1000;
      endsAtUtc = new Date(localDate.getTime() + durationMs).toISOString();
    } catch (err) {
      // ignore
    }
  }

  return { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc };
}

// --- Render multi-selects ---

export function renderSeriesLanguageList() {
  if (!dom.seriesLanguageList) return;
  renderChecklist(dom.seriesLanguageList, LANGUAGES, state.schedules.seriesForm.languages, {
    max: 3,
    filterText: dom.seriesLanguageFilter?.value,
    getLabel: item => getLanguageDisplayName(item.value, item.label),
    onChange: next => {
      state.schedules.seriesForm.languages = next;
      renderSeriesLanguageList();
      if (dom.seriesLanguageHint) {
        dom.seriesLanguageHint.textContent = t("common.fields.languagesHint", { count: next.length });
      }
    }
  });
}

export function renderSeriesPlatformList() {
  if (!dom.seriesPlatformList) return;
  renderChecklist(dom.seriesPlatformList, PLATFORMS, state.schedules.seriesForm.platforms, {
    onChange: next => {
      state.schedules.seriesForm.platforms = next;
      renderSeriesPlatformList();
    }
  });
}

export async function renderSeriesRoleRestrictions(api) {
  if (!dom.seriesRoleRestrictions || !dom.seriesRoleList) return;
  const groupId = dom.profileGroup?.value;
  const isGroupAccess = dom.seriesAccess?.value === "group";
  const shouldShow = Boolean(groupId) && isGroupAccess;
  dom.seriesRoleRestrictions.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    dom.seriesRoleList.innerHTML = "";
    return;
  }
  const requestId = ++roleFetchToken;
  dom.seriesRoleList.innerHTML = `<div class="hint">${t("common.loading")}</div>`;
  try {
    const roles = await fetchGroupRoles(api, groupId);
    if (requestId !== roleFetchToken) return;
    renderRoleList(dom.seriesRoleList, roles, state.schedules.seriesForm.roleIds, next => {
      state.schedules.seriesForm.roleIds = next;
    });
  } catch (err) {
    if (requestId !== roleFetchToken) return;
    dom.seriesRoleList.innerHTML = `<div class="hint">${t("common.errors.generic")}</div>`;
  }
}

// --- Visibility helpers ---

export function updateSeriesFrequencyVisibility() {
  const freq = dom.seriesFrequency?.value || "weekly";
  if (dom.seriesDaysOfWeekField) {
    dom.seriesDaysOfWeekField.classList.toggle("is-hidden", freq !== "weekly");
  }
}

export function updateSeriesDurationPreview() {
  if (!dom.seriesDuration || !dom.seriesDurationPreview) return;
  const minutes = parseDurationInput(dom.seriesDuration.value);
  dom.seriesDurationPreview.textContent = formatDurationPreview(minutes);
}

export function showSeriesEditor() {
  if (dom.seriesEditor) dom.seriesEditor.classList.remove("is-hidden");
  // Hide the wizard
  const wizard = document.getElementById("profile-wizard");
  if (wizard) wizard.classList.add("is-hidden");
}

export function hideSeriesEditor() {
  if (dom.seriesEditor) dom.seriesEditor.classList.add("is-hidden");
  const wizard = document.getElementById("profile-wizard");
  if (wizard) wizard.classList.remove("is-hidden");
}

// --- Action handlers ---

export async function handleSeriesCreate(api) {
  const groupId = dom.profileGroup?.value;
  if (!groupId) {
    showToast(t("series.errors.noGroup") || "Select a group first.", true);
    return;
  }
  const { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc } = readSeriesEditor();
  if (!label) {
    showToast(t("series.errors.noLabel") || "Series label is required.", true);
    return;
  }
  if (!eventTemplate.title) {
    showToast(t("series.errors.noTitle") || "Event name is required.", true);
    return;
  }
  if (!startsAtUtc || !endsAtUtc) {
    showToast(t("series.errors.noStartDate") || "First occurrence date and time are required.", true);
    return;
  }
  if (recurrence.frequency === "weekly" && (!recurrence.daysOfWeek || !recurrence.daysOfWeek.length)) {
    showToast(t("series.errors.noDaysOfWeek") || "Select at least one day of the week.", true);
    return;
  }
  if (recurrence.end?.type === "afterDate" && !recurrence.end.date) {
    showToast(t("series.errors.noEndDate") || "Set an end date.", true);
    return;
  }

  const result = await api.seriesCreate({
    groupId,
    label,
    eventTemplate,
    recurrence,
    startsAtUtc,
    endsAtUtc
  });

  if (!result?.ok) {
    showToast(result?.error?.message || t("series.errors.createFailed") || "Could not create series.", true);
    return;
  }

  showToast(t("series.created") || `Series "${label}" created.`);
  await loadSeriesForGroup(groupId);
  hideSeriesEditor();
  resetSeriesEditor();
  // Trigger a refresh of the schedule list
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
}

export async function handleSeriesUpdate(api) {
  const groupId = dom.profileGroup?.value;
  const seriesId = state.schedules.editingSeriesId;
  if (!groupId || !seriesId) {
    showToast(t("series.errors.noSeries") || "No series selected.", true);
    return;
  }
  const { label, eventTemplate, recurrence } = readSeriesEditor();
  if (!label) {
    showToast(t("series.errors.noLabel") || "Series label is required.", true);
    return;
  }

  // Detect if the recurrence rule is changing (warn about wiping modifications)
  const existing = state.series[groupId]?.[seriesId];
  const existingRec = existing?.recurrence || {};
  const recurrenceChanged = JSON.stringify(existingRec) !== JSON.stringify(recurrence);

  if (recurrenceChanged) {
    const check = await api.seriesCheckModifications({ groupId, seriesId });
    if (check?.ok && check.count > 0) {
      const msg = (t("series.warnings.recurrenceUpdate") || "Updating the schedule will regenerate all occurrences and discard {count} modified events. Continue?")
        .replace("{count}", String(check.count));
      if (!confirm(msg)) return;
    }
  }

  const result = await api.seriesUpdate({
    groupId,
    seriesId,
    label,
    eventTemplate,
    recurrence: recurrenceChanged ? recurrence : undefined
  });

  if (!result?.ok) {
    showToast(result?.error?.message || t("series.errors.updateFailed") || "Could not update series.", true);
    return;
  }

  showToast(t("series.updated") || `Series "${label}" updated.`);
  await loadSeriesForGroup(groupId);
  hideSeriesEditor();
  resetSeriesEditor();
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
}

export async function handleSeriesDelete(api, seriesId) {
  const groupId = dom.profileGroup?.value;
  if (!groupId || !seriesId) return;
  const seriesData = state.series[groupId]?.[seriesId];
  const label = seriesData?.label || "this series";
  const msg = (t("series.confirmDelete") || `Delete "{label}"? This will remove the series and all its occurrences from VRChat.`).replace("{label}", label);
  if (!confirm(msg)) return;

  const result = await api.seriesDelete({ groupId, seriesId });
  if (!result?.ok) {
    showToast(result?.error?.message || t("series.errors.deleteFailed") || "Could not delete series.", true);
    return;
  }
  showToast(t("series.deleted") || `Series "${label}" deleted.`);
  await loadSeriesForGroup(groupId);
  hideSeriesEditor();
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
}

// --- Display helpers ---

export function recurrenceToHumanString(recurrence) {
  if (!recurrence) return "";
  const freq = recurrence.frequency || "weekly";
  const interval = recurrence.interval || 1;
  const dayNames = { MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun" };

  const freqLabel = {
    daily: interval === 1 ? "Daily" : `Every ${interval} days`,
    weekly: interval === 1 ? "Weekly" : `Every ${interval} weeks`,
    monthly: interval === 1 ? "Monthly" : `Every ${interval} months`,
    yearly: interval === 1 ? "Yearly" : `Every ${interval} years`
  }[freq] || freq;

  let parts = [freqLabel];

  if (freq === "weekly" && Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length) {
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

export function isGroupSeriesActive(groupId) {
  return Boolean(state.series[groupId] && Object.keys(state.series[groupId]).length);
}
