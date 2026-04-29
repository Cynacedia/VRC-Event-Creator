import { dom, state } from "./state.js";
import { showToast } from "./ui.js";
import { renderSelect } from "./ui.js";
import { buildTimezones, ensureTimezoneOption, sanitizeText, formatDuration, parseDurationInput, formatDurationPreview } from "./utils.js";
import { EVENT_NAME_LIMIT, EVENT_DESCRIPTION_LIMIT } from "./config.js";
import { t } from "./i18n/index.js";

let _seriesApi = null;

export function initSeriesModule(api) {
  _seriesApi = api;
}

// --- Dropdown population ---

export function populateSeriesTimezoneDropdown() {
  if (!dom.seriesTimezone) return;
  const { systemTz, list } = buildTimezones();
  renderSelect(dom.seriesTimezone, list);
  ensureTimezoneOption(dom.seriesTimezone, systemTz);
  dom.seriesTimezone.value = systemTz;
}

// --- IPC ---

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

// --- Series step 3 form helpers ---

/** Reset only the series-specific recurrence inputs (step 3 series mode). */
export function resetSeriesRecurrenceForm() {
  // Default first occurrence: tomorrow at 8 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dom.seriesStartDate) {
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    dom.seriesStartDate.value = `${yyyy}-${mm}-${dd}`;
  }
  if (dom.seriesStartTime) dom.seriesStartTime.value = "20:00";
  if (dom.seriesDuration) {
    dom.seriesDuration.value = formatDuration(120);
    updateSeriesDurationPreview();
  }
  if (dom.seriesFrequency) dom.seriesFrequency.value = "weekly";
  if (dom.seriesInterval) dom.seriesInterval.value = "1";
  if (dom.seriesIntervalUnit) dom.seriesIntervalUnit.value = "weekly";
  document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  if (dom.seriesEndType) dom.seriesEndType.value = "never";
  if (dom.seriesEndCount) dom.seriesEndCount.value = "10";
  if (dom.seriesEndDate) dom.seriesEndDate.value = "";
  if (dom.seriesModificationWarning) {
    dom.seriesModificationWarning.classList.add("is-hidden");
    dom.seriesModificationWarning.textContent = "";
  }
  populateSeriesTimezoneDropdown();
  updateSeriesFrequencyVisibility();
  updateSeriesEndVisibility();
}

/** Apply an existing series's recurrence rule and event template to the wizard. */
export function applySeriesToWizard(seriesData) {
  if (!seriesData) return;
  state.schedules.editingType = "series";
  state.schedules.editingSeriesId = seriesData.seriesId;

  // Step 2: schedule basics — fill the wizard's existing inputs from eventTemplate
  const tpl = seriesData.eventTemplate || {};
  if (dom.profileDisplayName) dom.profileDisplayName.value = seriesData.label || "";
  if (dom.profileName) dom.profileName.value = tpl.title || "";
  if (dom.profileDescription) dom.profileDescription.value = tpl.description || "";
  if (dom.profileCategory) dom.profileCategory.value = tpl.category || "hangout";
  if (dom.profileImageId) dom.profileImageId.value = tpl.imageId || "";
  if (dom.profileSendNotification) dom.profileSendNotification.checked = Boolean(tpl.sendCreationNotification);
  if (dom.profileAccess) dom.profileAccess.value = tpl.accessType || "public";

  // Step 3: recurrence — fill series-specific inputs
  const rec = seriesData.recurrence || { frequency: "weekly", interval: 1 };
  populateSeriesTimezoneDropdown();
  if (dom.seriesTimezone && rec.timezone) {
    ensureTimezoneOption(dom.seriesTimezone, rec.timezone);
    dom.seriesTimezone.value = rec.timezone;
  }

  // Detect preset patterns and set the UI frequency accordingly
  const days = Array.isArray(rec.daysOfWeek) ? [...rec.daysOfWeek].sort() : [];
  const isWeekdaysPreset = rec.frequency === "weekly" && rec.interval === 1
    && days.length === 5 && ["FR", "MO", "TH", "TU", "WE"].every(d => days.includes(d));
  const isWeekendsPreset = rec.frequency === "weekly" && rec.interval === 1
    && days.length === 2 && ["SA", "SU"].every(d => days.includes(d));
  const isPlainPreset = rec.interval === 1 && days.length === 0;

  let uiFreq;
  if (isWeekdaysPreset) uiFreq = "weekdays";
  else if (isWeekendsPreset) uiFreq = "weekends";
  else if (isPlainPreset && ["daily", "weekly", "monthly", "yearly"].includes(rec.frequency)) {
    uiFreq = rec.frequency;
  } else {
    uiFreq = "custom";
  }
  if (dom.seriesFrequency) dom.seriesFrequency.value = uiFreq;
  if (uiFreq === "custom") {
    if (dom.seriesIntervalUnit) dom.seriesIntervalUnit.value = rec.frequency || "weekly";
    if (dom.seriesInterval) dom.seriesInterval.value = String(rec.interval || 1);
    document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]').forEach(cb => {
      cb.checked = days.includes(cb.dataset.day);
    });
  } else {
    if (dom.seriesInterval) dom.seriesInterval.value = "1";
    if (dom.seriesIntervalUnit) dom.seriesIntervalUnit.value = "weekly";
    document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
  }

  // End condition
  if (!rec.end) {
    if (dom.seriesEndType) dom.seriesEndType.value = "never";
  } else if (rec.end.type === "afterDate") {
    if (dom.seriesEndType) dom.seriesEndType.value = "afterDate";
    if (dom.seriesEndDate) dom.seriesEndDate.value = (rec.end.date || "").slice(0, 10);
  } else {
    if (dom.seriesEndType) dom.seriesEndType.value = "afterOccurrences";
    if (dom.seriesEndCount) dom.seriesEndCount.value = String(rec.end.count || 10);
  }
  if (dom.seriesDuration) {
    dom.seriesDuration.value = formatDuration(tpl.duration || 120);
    updateSeriesDurationPreview();
  }
  // Note: We don't have the original startsAt stored locally. Leave date/time blank
  // (user will see the wizard's date/time fields and can adjust if they want to update timing).
  if (dom.seriesStartDate) dom.seriesStartDate.value = "";
  if (dom.seriesStartTime) dom.seriesStartTime.value = "";
  if (dom.seriesModificationWarning) {
    dom.seriesModificationWarning.classList.add("is-hidden");
    dom.seriesModificationWarning.textContent = "";
  }
  updateSeriesFrequencyVisibility();
  updateSeriesEndVisibility();
}

/** Read the wizard form into a series payload. */
export function readSeriesFromWizard() {
  const label = sanitizeText(dom.profileDisplayName?.value || "", { maxLength: 100, trim: true });
  const title = sanitizeText(dom.profileName?.value || "", { maxLength: EVENT_NAME_LIMIT, trim: true });
  const description = sanitizeText(dom.profileDescription?.value || "", {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  // Tags from existing wizard tag input
  let tags = [];
  if (state.profile?.tagInput?.getTags) {
    tags = state.profile.tagInput.getTags();
  }
  const eventTemplate = {
    title,
    description,
    category: dom.profileCategory?.value || "hangout",
    accessType: dom.profileAccess?.value || "public",
    languages: Array.isArray(state.profile?.languages) ? state.profile.languages.slice() : [],
    platforms: Array.isArray(state.profile?.platforms) ? state.profile.platforms.slice() : [],
    tags,
    imageId: dom.profileImageId?.value.trim() || null,
    roleIds: dom.profileAccess?.value === "group" && Array.isArray(state.profile?.roleIds)
      ? state.profile.roleIds.filter(id => typeof id === "string" && id.trim())
      : [],
    duration: parseDurationInput(dom.seriesDuration?.value || "00:02:00"),
    sendCreationNotification: Boolean(dom.profileSendNotification?.checked)
  };

  // Map UI frequency selection to API recurrence object.
  // Daily / Weekly / Monthly / Yearly are simple (interval=1).
  // Weekdays = weekly with Mon-Fri; Weekends = weekly with Sat-Sun.
  // Custom unlocks the unit dropdown + day-of-week checkboxes.
  const uiFreq = dom.seriesFrequency?.value || "weekly";
  const timezone = dom.seriesTimezone?.value || "UTC";
  let recurrence;
  if (uiFreq === "weekdays") {
    recurrence = { frequency: "weekly", interval: 1, timezone, daysOfWeek: ["MO", "TU", "WE", "TH", "FR"] };
  } else if (uiFreq === "weekends") {
    recurrence = { frequency: "weekly", interval: 1, timezone, daysOfWeek: ["SA", "SU"] };
  } else if (uiFreq === "custom") {
    const unit = dom.seriesIntervalUnit?.value || "weekly";
    const interval = Math.max(1, Math.min(366, parseInt(dom.seriesInterval?.value || "1", 10) || 1));
    recurrence = { frequency: unit, interval, timezone };
    if (unit === "weekly") {
      const daysOfWeek = [];
      document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]:checked').forEach(cb => {
        daysOfWeek.push(cb.dataset.day);
      });
      if (daysOfWeek.length) recurrence.daysOfWeek = daysOfWeek;
    }
  } else {
    // daily / weekly / monthly / yearly
    recurrence = { frequency: uiFreq, interval: 1, timezone };
  }

  // End condition
  const endType = dom.seriesEndType?.value || "never";
  if (endType === "afterDate") {
    const dateVal = dom.seriesEndDate?.value || "";
    if (dateVal) recurrence.end = { type: "afterDate", date: `${dateVal}T23:59:00` };
  } else if (endType === "afterOccurrences") {
    const count = Math.max(1, Math.min(366, parseInt(dom.seriesEndCount?.value || "10", 10) || 10));
    recurrence.end = { type: "afterOccurrences", count };
  }
  // "never" → no end key

  // Build startsAt and endsAt
  const startDate = dom.seriesStartDate?.value || "";
  const startTime = dom.seriesStartTime?.value || "20:00";
  let startsAtUtc = null;
  let endsAtUtc = null;
  if (startDate) {
    const localStr = `${startDate}T${startTime}:00`;
    try {
      const localDate = new Date(localStr);
      startsAtUtc = localDate.toISOString();
      const durationMs = (eventTemplate.duration || 120) * 60 * 1000;
      endsAtUtc = new Date(localDate.getTime() + durationMs).toISOString();
    } catch (err) {
      // ignore
    }
  }

  return { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc };
}

// --- Visibility helpers ---

/** Show/hide custom interval and weekday checkboxes based on frequency selection. */
export function updateSeriesFrequencyVisibility() {
  const freq = dom.seriesFrequency?.value || "weekly";
  // "Custom" is the only frequency that exposes interval + unit fields
  if (dom.seriesCustomRow) {
    dom.seriesCustomRow.classList.toggle("is-hidden", freq !== "custom");
  }
  // Day-of-week checkboxes appear only when Custom + weekly unit
  let showDays = false;
  if (freq === "custom") {
    const unit = dom.seriesIntervalUnit?.value || "weekly";
    showDays = unit === "weekly";
  }
  if (dom.seriesDaysOfWeekField) {
    dom.seriesDaysOfWeekField.classList.toggle("is-hidden", !showDays);
  }
}

/** Show/hide end-condition input rows based on dropdown. */
export function updateSeriesEndVisibility() {
  const endType = dom.seriesEndType?.value || "never";
  if (dom.seriesEndOccurrencesRow) {
    dom.seriesEndOccurrencesRow.classList.toggle("is-hidden", endType !== "afterOccurrences");
  }
  if (dom.seriesEndDateRow) {
    dom.seriesEndDateRow.classList.toggle("is-hidden", endType !== "afterDate");
  }
}

export function updateSeriesDurationPreview() {
  if (!dom.seriesDuration || !dom.seriesDurationPreview) return;
  const minutes = parseDurationInput(dom.seriesDuration.value);
  dom.seriesDurationPreview.textContent = formatDurationPreview(minutes);
}

/** Show the appropriate mode container in step 3. Defaults to template if mode is null. */
export function showScheduleMode(mode) {
  // mode: "template" | "series" | null — null defaults to template (the existing flow)
  const effectiveMode = mode || "template";
  if (dom.scheduleModeTemplate) {
    dom.scheduleModeTemplate.classList.toggle("is-hidden", effectiveMode !== "template");
  }
  if (dom.scheduleModeSeries) {
    dom.scheduleModeSeries.classList.toggle("is-hidden", effectiveMode !== "series");
  }
  // Toggle button active state
  if (dom.scheduleTypeTemplateBtn) {
    dom.scheduleTypeTemplateBtn.classList.toggle("is-active", effectiveMode === "template");
  }
  if (dom.scheduleTypeSeriesBtn) {
    dom.scheduleTypeSeriesBtn.classList.toggle("is-active", effectiveMode === "series");
  }
  // Header blurb visibility
  if (dom.scheduleModeBlurbTemplate) {
    dom.scheduleModeBlurbTemplate.classList.toggle("is-hidden", effectiveMode !== "template");
  }
  if (dom.scheduleModeBlurbSeries) {
    dom.scheduleModeBlurbSeries.classList.toggle("is-hidden", effectiveMode !== "series");
  }
}

// --- Action handlers ---

export async function handleSeriesCreate(api) {
  const groupId = dom.profileGroup?.value;
  if (!groupId) {
    showToast(t("series.errors.noGroup") || "Select a group first.", true);
    return;
  }
  const { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc } = readSeriesFromWizard();
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
    return { success: false };
  }

  showToast((t("series.created") || "Series \"{label}\" created.").replace("{label}", label));
  await loadSeriesForGroup(groupId);
  state.schedules.editingType = null;
  state.schedules.editingSeriesId = null;
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
  return { success: true };
}

export async function handleSeriesUpdate(api) {
  const groupId = dom.profileGroup?.value;
  const seriesId = state.schedules.editingSeriesId;
  if (!groupId || !seriesId) {
    showToast(t("series.errors.noSeries") || "No series selected.", true);
    return { success: false };
  }
  const { label, eventTemplate, recurrence } = readSeriesFromWizard();
  if (!label) {
    showToast(t("series.errors.noLabel") || "Series label is required.", true);
    return { success: false };
  }

  const existing = state.series[groupId]?.[seriesId];
  const existingRec = existing?.recurrence || {};
  const recurrenceChanged = JSON.stringify(existingRec) !== JSON.stringify(recurrence);

  if (recurrenceChanged) {
    const check = await api.seriesCheckModifications({ groupId, seriesId });
    if (check?.ok && check.count > 0) {
      const msg = (t("series.warnings.recurrenceUpdate") || "Updating the schedule will regenerate all occurrences and discard {count} modified events. Continue?")
        .replace("{count}", String(check.count));
      if (!confirm(msg)) return { success: false };
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
    return { success: false };
  }

  showToast((t("series.updated") || "Series \"{label}\" updated.").replace("{label}", label));
  await loadSeriesForGroup(groupId);
  state.schedules.editingType = null;
  state.schedules.editingSeriesId = null;
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
  return { success: true };
}

export async function handleSeriesDelete(api, seriesId) {
  const groupId = dom.profileGroup?.value;
  if (!groupId || !seriesId) return { success: false };
  const seriesData = state.series[groupId]?.[seriesId];
  const label = seriesData?.label || "this series";
  const msg = (t("series.confirmDelete") || "Delete \"{label}\"? This will remove the series and all its occurrences from VRChat.").replace("{label}", label);
  if (!confirm(msg)) return { success: false, cancelled: true };

  const result = await api.seriesDelete({ groupId, seriesId });
  if (!result?.ok) {
    showToast(result?.error?.message || t("series.errors.deleteFailed") || "Could not delete series.", true);
    return { success: false };
  }
  showToast((t("series.deleted") || "Series \"{label}\" deleted.").replace("{label}", label));
  await loadSeriesForGroup(groupId);
  state.schedules.editingType = null;
  state.schedules.editingSeriesId = null;
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
  return { success: true };
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

  const parts = [freqLabel];

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
