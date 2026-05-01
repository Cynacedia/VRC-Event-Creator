import { dom, state } from "./state.js";
import { showToast, renderSelect, showConfirmModal } from "./ui.js";
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
  // Populate first occurrence date + time from saved metadata (interpreted in user's local timezone).
  // If firstOccurrenceUtc is missing (older series predating local persistence), leave the inputs
  // alone — the caller's inspectSeriesOccurrences backfill will set them from VRChat's data.
  if (seriesData.firstOccurrenceUtc) {
    const localDate = new Date(seriesData.firstOccurrenceUtc);
    if (!Number.isNaN(localDate.getTime())) {
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, "0");
      const dd = String(localDate.getDate()).padStart(2, "0");
      const hh = String(localDate.getHours()).padStart(2, "0");
      const mi = String(localDate.getMinutes()).padStart(2, "0");
      if (dom.seriesStartDate) dom.seriesStartDate.value = `${yyyy}-${mm}-${dd}`;
      if (dom.seriesStartTime) dom.seriesStartTime.value = `${hh}:${mi}`;
    }
  }
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
    duration: (parseDurationInput(dom.seriesDuration?.value || "00:02:00")?.minutes) || 120,
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

  // Build startsAt and endsAt — require BOTH date and time. Silently defaulting
  // the time was a real footgun: an empty field used to fall back to 20:00 and
  // the series got created at 8pm without telling the user.
  const startDate = dom.seriesStartDate?.value || "";
  const startTime = dom.seriesStartTime?.value || "";
  let startsAtUtc = null;
  let endsAtUtc = null;
  if (startDate && startTime) {
    const localStr = `${startDate}T${startTime}:00`;
    try {
      const localDate = new Date(localStr);
      if (!Number.isNaN(localDate.getTime())) {
        startsAtUtc = localDate.toISOString();
        const durationMs = (eventTemplate.duration || 120) * 60 * 1000;
        endsAtUtc = new Date(localDate.getTime() + durationMs).toISOString();
      }
    } catch (err) {
      // ignore
    }
  }

  // Read the announcements card flags (in step 4)
  const announcements = {
    calendarCreate: Boolean(document.getElementById("calendar-sync-check")?.checked),
    discordSync: Boolean(document.getElementById("discord-sync-check")?.checked),
    webhookPost: Boolean(document.getElementById("webhook-post-check")?.checked),
    customMessage: null
  };
  const customEnabled = document.getElementById("profile-webhook-message-enabled")?.checked;
  if (customEnabled) {
    announcements.customMessage = {
      text: document.getElementById("profile-webhook-message")?.value || "",
      imagePath: document.getElementById("profile-webhook-image-path")?.value || ""
    };
  }

  return { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc, announcements };
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
  // formatDurationPreview takes the raw string, not the parsed result
  dom.seriesDurationPreview.textContent = formatDurationPreview(dom.seriesDuration.value);
}

/** Update the wizard's Save button label based on editingType + editingSeriesId. */
export function updateSaveButtonLabel() {
  const btn = document.getElementById("profile-save");
  if (!btn) return;
  const type = state.schedules?.editingType || "template";
  let key = "schedules.saveButton.template";
  let fallback = "Save Template";
  if (type === "series") {
    if (state.schedules?.editingSeriesId) {
      key = "series.warnings.confirmUpdate";
      fallback = "Update Series";
    } else {
      key = "schedules.saveButton.seriesCreate";
      fallback = "Create Series";
    }
  }
  btn.textContent = t(key) || fallback;
  btn.dataset.i18n = key;
}

/**
 * Lock the recurrence-rule fields when a series has already started its first
 * occurrence. VRChat's rule: "A series can only be rescheduled before its first
 * occurrence begins." Fields stay visible but become read-only with a hint.
 */
export function setRecurrenceFieldsLocked(locked) {
  // VRChat locks date / time / frequency / interval / day-of-week after the first
  // occurrence starts, but the END condition (afterOccurrences / afterDate) IS
  // editable post-start (verified via API testing 2026-04-30). So we keep
  // seriesEndType / seriesEndCount / seriesEndDate UNLOCKED here.
  const fields = [
    dom.seriesStartDate,
    dom.seriesStartTime,
    dom.seriesTimezone,
    dom.seriesFrequency,
    dom.seriesInterval,
    dom.seriesIntervalUnit,
    ...document.querySelectorAll('#series-days-of-week-field input[type="checkbox"]')
  ];
  fields.forEach(el => {
    if (el) {
      el.disabled = Boolean(locked);
    }
  });
  // Hide the grey disclaimer when the yellow lock hint is showing (deduplicate)
  const disclaimer = document.getElementById("series-disclaimer");
  if (disclaimer) {
    disclaimer.classList.toggle("is-hidden", Boolean(locked));
  }
  // Show or hide a hint + Unlock button at the top of the recurrence card.
  // When the user clicks Unlock, the recurrence fields become editable AND we
  // flip state.schedules.recurrenceUnlocked so the save path uses the
  // regenerate flow (delete+recreate, preserve modifications).
  let hint = document.getElementById("series-locked-hint");
  if (locked) {
    if (!hint && dom.seriesStartDate) {
      const card = dom.seriesStartDate.closest(".card");
      if (card) {
        hint = document.createElement("div");
        hint.id = "series-locked-hint";
        hint.className = "hint warning series-locked-hint";
        const text = document.createElement("p");
        text.dataset.i18n = "series.lockedHint";
        text.textContent = t("series.lockedHint")
          || "This series has already started. Date, time, and the repeat rule are locked — but you can still adjust when it ends. To reschedule, click Unlock — saving will replace this series with a new one.";
        hint.appendChild(text);
        const actions = document.createElement("div");
        actions.className = "series-locked-actions";
        const unlockBtn = document.createElement("button");
        unlockBtn.type = "button";
        unlockBtn.id = "series-unlock-btn";
        unlockBtn.className = "ghost compact-button";
        unlockBtn.dataset.i18n = "series.unlockButton";
        unlockBtn.textContent = t("series.unlockButton") || "Unlock";
        unlockBtn.addEventListener("click", handleSeriesUnlock);
        actions.appendChild(unlockBtn);
        hint.appendChild(actions);
        card.insertBefore(hint, card.firstChild);
      }
    }
    // Reset the "unlocked override" flag whenever we re-enter locked mode
    if (state.schedules) state.schedules.recurrenceUnlocked = false;
    // Also clear any leftover regen banner from a previous unlock session
    const staleRegenBanner = document.getElementById("series-regen-warning");
    if (staleRegenBanner) staleRegenBanner.remove();
  } else if (hint) {
    hint.remove();
  }
}

/**
 * Replace the locked banner with an unlocked-warning banner that says "saving
 * will regenerate the series". The recurrence fields are unlocked. We do NOT
 * call any destructive API here — the destructive work happens at save time.
 * We DO query seriesCheckModifications so the banner copy reflects whether a
 * Keep/Discard decision is coming on save.
 */
async function handleSeriesUnlock() {
  if (!state.schedules) return;
  // Set the override flag FIRST so any subsequent setRecurrenceFieldsLocked call
  // from concurrent inspect retries doesn't undo the unlock.
  state.schedules.recurrenceUnlocked = true;
  setRecurrenceFieldsLocked(false);
  if (!dom.seriesStartDate) return;
  const card = dom.seriesStartDate.closest(".card");
  if (!card) return;
  let banner = document.getElementById("series-regen-warning");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "series-regen-warning";
    banner.className = "hint warning series-locked-hint";
    const text = document.createElement("p");
    text.id = "series-regen-warning-text";
    banner.appendChild(text);
    card.insertBefore(banner, card.firstChild);
  }
  const textEl = banner.querySelector("#series-regen-warning-text");
  // Default copy assumes no modifications until we hear otherwise
  const baseCopy = t("series.regenWarning")
    || "Recurrence is unlocked. If you change the recurrence, the current series will be replaced with a new one.";
  textEl.textContent = baseCopy;
  // Async check: if modifications exist, update the banner to mention them
  const groupId = dom.profileGroup?.value;
  const seriesId = state.schedules.editingSeriesId;
  if (!_seriesApi?.seriesCheckModifications || !groupId || !seriesId) return;
  try {
    const check = await _seriesApi.seriesCheckModifications({ groupId, seriesId });
    if (check?.ok && check.count > 0) {
      const withMods = (t("series.regenWarningWithMods")
        || "Recurrence is unlocked. If you change the recurrence, the current series will be replaced with a new one and you'll be asked how to handle its {count} modified events.")
        .replace("{count}", String(check.count));
      textEl.textContent = withMods;
    }
  } catch (err) {
    // Non-fatal — banner stays on the no-modifications copy
  }
}

/**
 * Inspect a series's occurrences. Returns:
 *   { started: bool|null, earliestStart: ISO|null, earliestEnd: ISO|null }
 * - started: true if any occurrence's start is in the past, false otherwise, null on error
 * - earliestStart: ISO of the earliest occurrence (used to backfill the form when the
 *   series was created before we stored firstOccurrenceUtc locally)
 */
export async function inspectSeriesOccurrences(api, groupId, seriesId) {
  const result = { started: null, earliestStart: null, earliestEnd: null };
  if (!api?.listGroupEvents) return result;
  try {
    const events = await api.listGroupEvents({ groupId, upcomingOnly: false });
    const now = Date.now();
    const occurrences = (events || []).filter(e => e.seriesId === seriesId);
    if (!occurrences.length) return result;
    // Sort by start time ascending, take the first
    occurrences.sort((a, b) => {
      const aMs = a.startsAtUtc ? Date.parse(a.startsAtUtc) : Number.POSITIVE_INFINITY;
      const bMs = b.startsAtUtc ? Date.parse(b.startsAtUtc) : Number.POSITIVE_INFINITY;
      return aMs - bMs;
    });
    const earliest = occurrences[0];
    result.earliestStart = earliest?.startsAtUtc || null;
    result.earliestEnd = earliest?.endsAtUtc || null;
    result.started = occurrences.some(e => {
      const start = e.startsAtUtc ? Date.parse(e.startsAtUtc) : null;
      return start && start <= now;
    });
    return result;
  } catch (err) {
    console.error("inspectSeriesOccurrences failed:", err);
    return result;
  }
}

/** @deprecated Use inspectSeriesOccurrences for richer info. Kept for legacy callers. */
export async function checkSeriesStarted(api, groupId, seriesId) {
  const info = await inspectSeriesOccurrences(api, groupId, seriesId);
  return info.started;
}

/** Show the appropriate mode container in step 3. Defaults to template if mode is null.
 *  When editing an existing schedule, the type is locked — toggle gets disabled. */
export function showScheduleMode(mode, options = {}) {
  // mode: "template" | "series" | null — null defaults to template (the existing flow)
  // options.lock: when true, disables the type toggle (used when editing existing schedules)
  const effectiveMode = mode || "template";
  const locked = Boolean(options.lock);
  if (dom.scheduleModeTemplate) {
    dom.scheduleModeTemplate.classList.toggle("is-hidden", effectiveMode !== "template");
  }
  if (dom.scheduleModeSeries) {
    dom.scheduleModeSeries.classList.toggle("is-hidden", effectiveMode !== "series");
  }
  // Toggle button active + disabled state
  if (dom.scheduleTypeTemplateBtn) {
    dom.scheduleTypeTemplateBtn.classList.toggle("is-active", effectiveMode === "template");
    dom.scheduleTypeTemplateBtn.disabled = locked;
    dom.scheduleTypeTemplateBtn.classList.toggle("is-locked", locked);
  }
  if (dom.scheduleTypeSeriesBtn) {
    dom.scheduleTypeSeriesBtn.classList.toggle("is-active", effectiveMode === "series");
    dom.scheduleTypeSeriesBtn.disabled = locked;
    dom.scheduleTypeSeriesBtn.classList.toggle("is-locked", locked);
  }
  // Header blurb visibility
  if (dom.scheduleModeBlurbTemplate) {
    dom.scheduleModeBlurbTemplate.classList.toggle("is-hidden", effectiveMode !== "template");
  }
  if (dom.scheduleModeBlurbSeries) {
    dom.scheduleModeBlurbSeries.classList.toggle("is-hidden", effectiveMode !== "series");
  }
  // Sync Save button label with the current mode
  updateSaveButtonLabel();
  // Adapt the Announcements hint to the schedule type
  const announcementsHint = document.getElementById("profile-announcements-hint");
  if (announcementsHint) {
    const key = effectiveMode === "series"
      ? "schedules.announcements.hintSeries"
      : "schedules.announcements.hint";
    const fallback = effectiveMode === "series"
      ? "Toggle the actions to perform when this series is created or modified."
      : "Toggle the actions to perform when this schedule posts an event.";
    announcementsHint.textContent = t(key) || fallback;
    announcementsHint.dataset.i18n = key;
  }
}

// --- Action handlers ---

export async function handleSeriesCreate(api) {
  if (state.app?.updateAvailable) {
    showToast(t("series.updateRequired") || "Update available. Please update before changing series.", true, { duration: 8000 });
    return { success: false };
  }
  const groupId = dom.profileGroup?.value;
  if (!groupId) {
    showToast(t("common.errors.noGroup") || "Select a group.", true);
    return;
  }
  const { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc, announcements } = readSeriesFromWizard();
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
  const startMs = Date.parse(startsAtUtc);
  if (!Number.isFinite(startMs) || startMs < Date.now()) {
    showToast(t("series.errors.startInPast")
      || "First occurrence must be in the future. Update the date before saving.", true);
    return;
  }
  // For Custom + weekly unit, require at least one day of the week
  const uiFreq = dom.seriesFrequency?.value;
  const unit = dom.seriesIntervalUnit?.value;
  if (uiFreq === "custom" && unit === "weekly" && (!recurrence.daysOfWeek || !recurrence.daysOfWeek.length)) {
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
    endsAtUtc,
    announcements
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
  if (state.app?.updateAvailable) {
    showToast(t("series.updateRequired") || "Update available. Please update before changing series.", true, { duration: 8000 });
    return { success: false };
  }
  const groupId = dom.profileGroup?.value;
  const seriesId = state.schedules.editingSeriesId;
  if (!groupId || !seriesId) {
    showToast(t("series.errors.noSeries") || "No series selected.", true);
    return { success: false };
  }
  const { label, eventTemplate, recurrence, startsAtUtc, endsAtUtc, announcements } = readSeriesFromWizard();
  if (!label) {
    showToast(t("series.errors.noLabel") || "Series label is required.", true);
    return { success: false };
  }

  const existing = state.series[groupId]?.[seriesId];
  const existingRec = existing?.recurrence || {};
  const recurrenceRuleChanged = JSON.stringify(existingRec) !== JSON.stringify(recurrence);
  // The first occurrence date+time lives on startsAt/endsAt, NOT inside the
  // recurrence object. A change there also regenerates all occurrences and
  // wipes occurrenceModified flags, so it must be treated like a recurrence
  // change for warning + regenerate purposes.
  const startTimeChanged = startsAtUtc && existing?.firstOccurrenceUtc
    && Date.parse(startsAtUtc) !== Date.parse(existing.firstOccurrenceUtc);
  const recurrenceChanged = recurrenceRuleChanged || Boolean(startTimeChanged);
  const unlocked = Boolean(state.schedules?.recurrenceUnlocked);

  // Regenerate path: user explicitly unlocked recurrence on a started series.
  // Delete + recreate, preserving modifications via the rasterize queue.
  if (unlocked && recurrenceChanged) {
    // Client-side validation BEFORE any destructive call. The most common
    // cause of regen failure is a startsAt that's in the past (because the
    // form had the old start date and the user didn't update it).
    if (!startsAtUtc || !endsAtUtc) {
      showToast(t("series.errors.noStartDate") || "First occurrence date and time are required.", true);
      return { success: false };
    }
    const startMs = Date.parse(startsAtUtc);
    if (!Number.isFinite(startMs) || startMs < Date.now()) {
      showToast(t("series.errors.startInPast")
        || "First occurrence must be in the future. Update the date before saving.", true);
      return { success: false };
    }
    const check = await api.seriesCheckModifications({ groupId, seriesId });
    const modCount = check?.ok ? check.count : 0;
    let strategy = "discard";
    if (modCount > 0) {
      const choice = await showRegenerateChoiceModal(modCount);
      if (choice === "cancel") return { success: false };
      strategy = choice; // "keep" | "discard"
    } else {
      // No modifications — confirm the destructive action anyway since seriesId will change
      const confirmed = await showConfirmModal({
        title: t("series.regen.choiceTitle") || "Replace series?",
        message: t("series.regen.confirmMessage") || "This will replace the current series with a new one. Continue?",
        confirmLabel: t("series.regen.confirmAction") || "Replace Series",
        cancelLabel: t("common.cancel") || "Cancel",
        danger: true
      });
      if (!confirmed) return { success: false };
    }

    const result = await api.seriesRegenerate({
      groupId,
      seriesId,
      label,
      eventTemplate,
      recurrence,
      startsAtUtc,
      endsAtUtc,
      announcements,
      modificationStrategy: strategy,
      modifiedOccurrences: strategy === "keep" && check?.ok ? check.occurrences : []
    });

    if (!result?.ok) {
      showToast(result?.error?.message || t("series.errors.regenFailed") || "Could not regenerate series.", true);
      return { success: false };
    }

    let toastKey = "series.regen.success";
    let fallback = "Series \"{label}\" replaced.";
    if (strategy === "keep" && modCount > 0) {
      toastKey = "series.regen.successWithMods";
      fallback = "Series \"{label}\" replaced. {count} modifications queued.";
    }
    showToast((t(toastKey) || fallback).replace("{label}", label).replace("{count}", String(modCount)));
    state.schedules.recurrenceUnlocked = false;
    await loadSeriesForGroup(groupId);
    state.schedules.editingType = null;
    state.schedules.editingSeriesId = null;
    document.dispatchEvent(new CustomEvent("schedules:refresh"));
    document.dispatchEvent(new CustomEvent("rasterize:changed"));
    return { success: true };
  }

  // Standard update path (recurrence unchanged, or recurrence editable pre-start)
  if (!startsAtUtc || !endsAtUtc) {
    showToast(t("series.errors.noStartDate") || "First occurrence date and time are required.", true);
    return { success: false };
  }
  // Only block past dates when recurrence changed (i.e. server will re-expand from startsAt).
  // For pure event-detail updates with unchanged recurrence, leave startsAt alone.
  if (recurrenceChanged) {
    const startMs = Date.parse(startsAtUtc);
    if (!Number.isFinite(startMs) || startMs < Date.now()) {
      showToast(t("series.errors.startInPast")
        || "First occurrence must be in the future. Update the date before saving.", true);
      return { success: false };
    }
  }
  // When recurrence/time changes, VRChat regenerates occurrences and wipes
  // occurrenceModified flags. Same Keep/Discard/Cancel choice as the regenerate
  // path — modifications get rescued via the rasterize queue regardless of
  // whether we're going through PUT (pre-start) or DELETE+CREATE (post-start).
  let strategyForUpdate = "discard";
  let modsForUpdate = [];
  if (recurrenceChanged) {
    const check = await api.seriesCheckModifications({ groupId, seriesId });
    const modCount = check?.ok ? check.count : 0;
    if (modCount > 0) {
      const choice = await showRegenerateChoiceModal(modCount);
      if (choice === "cancel") return { success: false };
      strategyForUpdate = choice;
      if (choice === "keep" && check?.ok) modsForUpdate = check.occurrences;
    }
  }

  const result = await api.seriesUpdate({
    groupId,
    seriesId,
    label,
    eventTemplate,
    recurrence: recurrenceChanged ? recurrence : undefined,
    startsAtUtc,
    endsAtUtc,
    announcements,
    modificationStrategy: strategyForUpdate,
    modifiedOccurrences: modsForUpdate
  });

  if (!result?.ok) {
    showToast(result?.error?.message || t("series.errors.updateFailed") || "Could not update series.", true);
    return { success: false };
  }

  if (strategyForUpdate === "keep" && modsForUpdate.length > 0) {
    showToast((t("series.regen.successWithMods") || "Series \"{label}\" replaced. {count} modifications queued.")
      .replace("{label}", label)
      .replace("{count}", String(modsForUpdate.length)));
    document.dispatchEvent(new CustomEvent("rasterize:changed"));
  } else {
    showToast((t("series.updated") || "Series \"{label}\" updated.").replace("{label}", label));
  }
  await loadSeriesForGroup(groupId);
  state.schedules.editingType = null;
  state.schedules.editingSeriesId = null;
  document.dispatchEvent(new CustomEvent("schedules:refresh"));
  return { success: true };
}

/**
 * Three-button modal asking the user how to handle modified occurrences when
 * regenerating a series. Returns "keep" | "discard" | "cancel".
 */
function showRegenerateChoiceModal(modCount) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    const modal = document.createElement("div");
    modal.className = "modal";
    const h = document.createElement("h3");
    h.textContent = t("series.regen.choiceTitle") || "Replace series?";
    modal.appendChild(h);
    const p = document.createElement("p");
    p.className = "hint";
    p.style.whiteSpace = "pre-line";
    p.textContent = (t("series.regen.choiceMessage")
      || "This series has {count} modified events. The current series will be replaced with a new one.\n\n• Keep modifications: same-day overlaps update the new series; non-overlap events become standalones.\n• Discard modifications: changes to those occurrences are lost.")
      .replace("{count}", String(modCount));
    modal.appendChild(p);
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost";
    cancel.textContent = t("common.cancel") || "Cancel";
    const discard = document.createElement("button");
    discard.type = "button";
    discard.className = "danger";
    discard.textContent = t("series.regen.discard") || "Discard Modifications";
    const keep = document.createElement("button");
    keep.type = "button";
    keep.className = "primary";
    keep.textContent = t("series.regen.keep") || "Keep Modifications";
    actions.appendChild(cancel);
    actions.appendChild(discard);
    actions.appendChild(keep);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = result => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      resolve(result);
    };
    const onKey = e => { if (e.key === "Escape") close("cancel"); };
    cancel.addEventListener("click", () => close("cancel"));
    discard.addEventListener("click", () => close("discard"));
    keep.addEventListener("click", () => close("keep"));
    overlay.addEventListener("click", e => { if (e.target === overlay) close("cancel"); });
    document.addEventListener("keydown", onKey);
    keep.focus();
  });
}

export async function handleSeriesDelete(api, seriesId) {
  if (state.app?.updateAvailable) {
    showToast(t("series.updateRequired") || "Update available. Please update before changing series.", true, { duration: 8000 });
    return { success: false };
  }
  const groupId = dom.profileGroup?.value;
  if (!groupId || !seriesId) return { success: false };
  const seriesData = state.series[groupId]?.[seriesId];
  const label = seriesData?.label || "this series";
  const msg = (t("series.confirmDelete") || "Delete \"{label}\"? This will remove the series and all its occurrences from VRChat.").replace("{label}", label);
  const confirmed = await showConfirmModal({
    title: t("series.confirmDeleteTitle") || "Delete series?",
    message: msg,
    confirmLabel: t("common.delete") || "Delete",
    cancelLabel: t("common.cancel") || "Cancel",
    danger: true
  });
  if (!confirmed) return { success: false, cancelled: true };

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

// ----------------------------------------------------------------------------
// Rasterize queue status indicator. Shows when the local pending-rasterize.json
// queue has entries waiting (e.g. rate limited 429s after a regeneration).
// Surfaces below the schedule selector on the Manage Schedules tab.
// ----------------------------------------------------------------------------
let _rasterizeStatusInited = false;

function formatRelativeRetry(nextRetryAt) {
  if (!nextRetryAt) return "";
  const ms = Date.parse(nextRetryAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

export async function refreshRasterizeStatus() {
  if (!_seriesApi?.seriesRasterizeStatus) return;
  const container = document.getElementById("rasterize-status");
  const textEl = document.getElementById("rasterize-status-text");
  if (!container || !textEl) return;
  let result;
  try {
    result = await _seriesApi.seriesRasterizeStatus();
  } catch (err) {
    container.classList.add("is-hidden");
    return;
  }
  if (!result?.ok || !result.count) {
    container.classList.add("is-hidden");
    return;
  }
  // Find the soonest nextRetryAt across all entries
  const soonest = result.entries
    .map(e => e.nextRetryAt)
    .filter(Boolean)
    .sort()[0];
  const wait = formatRelativeRetry(soonest);
  const template = t("series.rasterize.statusText")
    || "{count} pending event(s) waiting to be created.{wait}";
  const waitSuffix = wait ? ` ${(t("series.rasterize.retryIn") || "Next retry in {wait}.").replace("{wait}", wait)}` : "";
  textEl.textContent = template
    .replace("{count}", String(result.count))
    .replace("{wait}", waitSuffix);
  container.classList.remove("is-hidden");
}

export function initRasterizeStatusIndicator() {
  if (_rasterizeStatusInited) return;
  _rasterizeStatusInited = true;
  const retryBtn = document.getElementById("rasterize-status-retry");
  if (retryBtn) {
    retryBtn.addEventListener("click", async () => {
      if (!_seriesApi?.seriesRasterizeDrain) return;
      retryBtn.disabled = true;
      try {
        await _seriesApi.seriesRasterizeDrain();
      } finally {
        retryBtn.disabled = false;
        await refreshRasterizeStatus();
      }
    });
  }
  document.addEventListener("rasterize:changed", () => {
    refreshRasterizeStatus().catch(() => {});
  });
  // Periodic refresh (every minute) so the "next retry in Xm" countdown updates
  setInterval(() => {
    refreshRasterizeStatus().catch(() => {});
  }, 60 * 1000);
  // Initial refresh
  refreshRasterizeStatus().catch(() => {});
}
