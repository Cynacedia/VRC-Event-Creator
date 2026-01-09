// Profile management module
import { EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, TAG_LIMIT } from "./config.js";
import { dom, state, setProfileEditConfirmed, getProfileEditConfirmed, getProfileWizard } from "./state.js";
import { t } from "./i18n/index.js";
import { enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, formatDurationPreview, enforceGroupAccess, sanitizeDurationInputValue } from "./utils.js";
import { fetchGroupRoles, renderRoleList } from "./roles.js";

let roleFetchToken = 0;

function getDurationUnits() {
  return {
    day: t("common.durationUnits.day"),
    hour: t("common.durationUnits.hour"),
    minute: t("common.durationUnits.minute")
  };
}

function getRoleLabels() {
  return {
    allAccess: t("events.roleRestrictions.allAccess"),
    managementRoles: t("events.roleRestrictions.managementRoles"),
    roles: t("events.roleRestrictions.roles"),
    noRoles: t("events.roleRestrictions.noRoles")
  };
}

export async function renderProfileRoleRestrictions(api) {
  if (!dom.profileRoleRestrictions || !dom.profileRoleList) {
    return;
  }
  const groupId = dom.profileGroup.value;
  const isGroupAccess = dom.profileAccess.value === "group";
  const shouldShow = Boolean(groupId) && isGroupAccess;
  dom.profileRoleRestrictions.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    dom.profileRoleList.innerHTML = "";
    return;
  }
  const requestId = ++roleFetchToken;
  dom.profileRoleList.innerHTML = `<div class="hint">${t("common.loading")}</div>`;
  try {
    const roles = await fetchGroupRoles(api, groupId);
    if (requestId !== roleFetchToken) {
      return;
    }
    const validIds = new Set(roles.map(role => role.id));
    state.profile.roleIds = (state.profile.roleIds || []).filter(id => validIds.has(id));
    renderRoleList({
      container: dom.profileRoleList,
      roles,
      selectedIds: state.profile.roleIds,
      labels: getRoleLabels(),
      onChange: next => {
        state.profile.roleIds = next;
      }
    });
  } catch (err) {
    dom.profileRoleList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = getRoleLabels().noRoles;
    dom.profileRoleList.appendChild(empty);
  }
}

export function updateProfileDurationPreview() {
  if (!dom.profileDurationPreview || !dom.profileDuration) {
    return;
  }
  dom.profileDurationPreview.textContent = formatDurationPreview(dom.profileDuration.value, getDurationUnits());
}

// Helper function to get profile label
export function getProfileLabel(profileKey, profile) {
  const label = (profile?.displayName || "").trim();
  return label || profileKey;
}

// Helper function to slugify profile key
export function slugifyProfileKey(value) {
  const base = (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 40);
}

// Helper function to get unique profile key
export function getUniqueProfileKey(groupId, baseKey) {
  const profiles = state.profiles?.[groupId]?.profiles || {};
  if (!profiles[baseKey]) {
    return baseKey;
  }
  let counter = 2;
  let nextKey = `${baseKey}-${counter}`;
  while (profiles[nextKey]) {
    counter += 1;
    nextKey = `${baseKey}-${counter}`;
  }
  return nextKey;
}

// Helper function to build profile key
export function buildProfileKey(groupId, displayName, fallbackName) {
  const base = slugifyProfileKey(displayName || fallbackName);
  if (!base) {
    return `profile-${Date.now()}`;
  }
  return getUniqueProfileKey(groupId, base);
}

// Helper function to get group name
export function getGroupName(groupId) {
  const group = (state.groups || []).find(item => item.groupId === groupId);
  return group ? group.name : "Unknown Group";
}

// Set profile mode (create or edit)
export function setProfileMode(mode) {
  state.profile.mode = mode;
  const isEdit = mode === "edit";
  dom.profileGroup.disabled = isEdit;
}

// Automation form helpers
function parseAutomationTimingInput(value) {
  const parsed = parseDurationInput(value);
  if (!parsed) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
  }
  const totalMinutes = parsed.minutes;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes, totalMinutes };
}

function formatAutomationTimingValue(days, hours, minutes) {
  let totalMinutes = (days * 1440) + (hours * 60) + minutes;
  const normDays = Math.floor(totalMinutes / 1440);
  const normHours = Math.floor((totalMinutes % 1440) / 60);
  const normMinutes = totalMinutes % 60;
  return `${String(normDays).padStart(2, "0")}:${String(normHours).padStart(2, "0")}:${String(normMinutes).padStart(2, "0")}`;
}

function resetAutomationForm() {
  if (dom.automationEnabled) dom.automationEnabled.checked = false;
  if (dom.automationSettings) dom.automationSettings.classList.add("is-hidden");
  if (dom.automationTimingMode) dom.automationTimingMode.value = "before";
  if (dom.automationTimingInput) dom.automationTimingInput.value = "07:00:00";
  if (dom.automationMonthlyDay) dom.automationMonthlyDay.value = "1";
  if (dom.automationMonthlyTime) dom.automationMonthlyTime.value = "18:00";
  if (dom.automationRepeatMode) dom.automationRepeatMode.value = "indefinite";
  if (dom.automationRepeatCount) dom.automationRepeatCount.value = "10";
  if (dom.automationOffsetSettings) dom.automationOffsetSettings.classList.remove("is-hidden");
  if (dom.automationMonthlySettings) dom.automationMonthlySettings.classList.add("is-hidden");
  if (dom.automationOffsetProse) dom.automationOffsetProse.classList.remove("is-hidden");
  if (dom.automationMonthlyProse) dom.automationMonthlyProse.classList.add("is-hidden");
  if (dom.automationRepeatCountField) dom.automationRepeatCountField.classList.add("is-hidden");
}

function applyAutomationToForm(automation) {
  if (!automation) {
    resetAutomationForm();
    return;
  }

  if (dom.automationEnabled) dom.automationEnabled.checked = automation.enabled || false;
  if (dom.automationSettings) dom.automationSettings.classList.toggle("is-hidden", !automation.enabled);
  if (dom.automationTimingMode) dom.automationTimingMode.value = automation.timingMode || "before";

  // Convert days/hours/minutes to DD:HH:MM format
  const days = automation.daysOffset ?? 7;
  const hours = automation.hoursOffset ?? 0;
  const minutes = automation.minutesOffset ?? 0;
  if (dom.automationTimingInput) {
    dom.automationTimingInput.value = formatAutomationTimingValue(days, hours, minutes);
  }

  if (dom.automationMonthlyDay) dom.automationMonthlyDay.value = String(automation.monthlyDay ?? 1);
  if (dom.automationMonthlyTime) {
    const hour = String(automation.monthlyHour ?? 18).padStart(2, "0");
    const minute = String(automation.monthlyMinute ?? 0).padStart(2, "0");
    dom.automationMonthlyTime.value = `${hour}:${minute}`;
  }
  if (dom.automationRepeatMode) dom.automationRepeatMode.value = automation.repeatMode || "indefinite";
  if (dom.automationRepeatCount) dom.automationRepeatCount.value = String(automation.repeatCount ?? 10);

  // Update visibility based on settings
  const isMonthly = automation.timingMode === "monthly";
  if (dom.automationOffsetSettings) dom.automationOffsetSettings.classList.toggle("is-hidden", isMonthly);
  if (dom.automationMonthlySettings) dom.automationMonthlySettings.classList.toggle("is-hidden", !isMonthly);
  if (dom.automationOffsetProse) dom.automationOffsetProse.classList.toggle("is-hidden", isMonthly);
  if (dom.automationMonthlyProse) dom.automationMonthlyProse.classList.toggle("is-hidden", !isMonthly);

  const isCount = automation.repeatMode === "count";
  if (dom.automationRepeatCountField) dom.automationRepeatCountField.classList.toggle("is-hidden", !isCount);

  // Update prose display - will be called after form is applied and ready
  if (window.updateAutomationProse) {
    window.updateAutomationProse();
  }
}

function getAutomationFromForm() {
  // Parse DD:HH:MM timing input
  const timing = parseAutomationTimingInput(dom.automationTimingInput?.value);

  // Parse monthly time picker value
  let monthlyHour = 18;
  let monthlyMinute = 0;
  if (dom.automationMonthlyTime?.value) {
    const [h, m] = dom.automationMonthlyTime.value.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      monthlyHour = h;
      monthlyMinute = m;
    }
  }

  return {
    enabled: dom.automationEnabled?.checked || false,
    timingMode: dom.automationTimingMode?.value || "before",
    daysOffset: timing.days,
    hoursOffset: timing.hours,
    minutesOffset: timing.minutes,
    monthlyDay: Number(dom.automationMonthlyDay?.value) || 1,
    monthlyHour,
    monthlyMinute,
    repeatMode: dom.automationRepeatMode?.value || "indefinite",
    repeatCount: Number(dom.automationRepeatCount?.value) || 10
  };
}

/**
 * Get minimum frequency (in days) between events based on patterns
 * @param {Array} patterns - Array of pattern objects
 * @returns {number} Minimum days between events, or Infinity if no patterns
 */
function getMinPatternFrequencyDays(patterns) {
  if (!patterns?.length) return Infinity;

  let minDays = Infinity;
  let hasEvery = false;
  let hasEveryOther = false;
  let nthCount = 0;

  for (const p of patterns) {
    if (p.type === "every") {
      hasEvery = true;
      minDays = Math.min(minDays, 7);
    } else if (p.type === "every-other") {
      hasEveryOther = true;
      minDays = Math.min(minDays, 14);
    } else if (p.type === "nth" || p.type === "last") {
      nthCount++;
      // If multiple nth/last patterns exist (e.g., 1st Monday + 3rd Monday),
      // they could be 7-14 days apart within the same month
      // Use 14 days as reasonable estimate for multiple occurrences
      if (nthCount > 1) {
        minDays = Math.min(minDays, 14);
      } else {
        // Single nth/last pattern occurs monthly: ~28 days
        minDays = Math.min(minDays, 28);
      }
    } else if (p.type === "annual") {
      minDays = Math.min(minDays, 365);
    }
  }
  return minDays;
}

/**
 * Validate and auto-correct automation offset settings
 * If offset exceeds pattern frequency, auto-switch mode and/or cap values
 */
export function validateAndCorrectAutomationOffset() {
  const warningEl = document.getElementById("automation-offset-warning");
  const enabled = dom.automationEnabled?.checked;
  const timingMode = dom.automationTimingMode?.value;
  const minFrequency = getMinPatternFrequencyDays(state.profile.patterns);

  // Hide warning by default
  if (warningEl) warningEl.classList.add("is-hidden");

  // Skip if disabled, monthly mode, or no patterns
  if (!enabled || timingMode === "monthly" || minFrequency === Infinity) return;

  // Parse the DD:HH:MM timing input
  const timing = parseAutomationTimingInput(dom.automationTimingInput?.value);
  const offsetDays = timing.days + (timing.hours / 24) + (timing.minutes / 1440);

  // For "after" mode: if offset > half the frequency, auto-switch to "before" mode
  // (Offset > frequency/2 means risk of publishing too close to next event)
  if (timingMode === "after" && offsetDays > minFrequency / 2) {
    dom.automationTimingMode.value = "before";
    // Convert "after" offset to equivalent "before" offset
    // If offsetting X days after and pattern frequency is Y days, that's (Y - X) days before next event
    const beforeEquivalent = minFrequency - offsetDays;
    const cappedDays = Math.max(1, Math.floor(beforeEquivalent));
    dom.automationTimingInput.value = formatAutomationTimingValue(cappedDays, 0, 0);

    if (warningEl) {
      warningEl.textContent = t("profiles.automation.offsetCorrected", {
        oldOffset: Math.round(offsetDays),
        frequency: minFrequency,
        newOffset: cappedDays
      });
      warningEl.classList.remove("is-hidden");
    }

    // Update prose after correction
    if (window.updateAutomationProse) {
      window.updateAutomationProse();
    }
    return;
  }

  // For "before" mode: if offset >= frequency, cap it to frequency - 1 day
  if (timingMode === "before" && offsetDays >= minFrequency) {
    const cappedDays = Math.max(1, minFrequency - 1);
    dom.automationTimingInput.value = formatAutomationTimingValue(cappedDays, 0, 0);

    if (warningEl) {
      warningEl.textContent = t("profiles.automation.offsetCapped", {
        oldOffset: Math.round(offsetDays),
        newOffset: cappedDays
      });
      warningEl.classList.remove("is-hidden");
    }

    // Update prose after correction
    if (window.updateAutomationProse) {
      window.updateAutomationProse();
    }
  }
}

// Reset profile form to defaults
export function resetProfileForm() {
  setProfileMode("create");
  setProfileEditConfirmed(false);
  state.profile.currentKey = null;
  state.profile.roleIds = [];
  if (dom.profileRoleRestrictions) {
    dom.profileRoleRestrictions.classList.add("is-hidden");
  }
  if (dom.profileRoleList) {
    dom.profileRoleList.innerHTML = "";
  }
  dom.profileDisplayName.value = "";
  dom.profileName.value = "";
  dom.profileDescription.value = "";
  dom.profileCategory.value = "hangout";
  if (state.profile.tagInput) {
    state.profile.tagInput.clear();
  } else {
    dom.profileTags.value = "";
  }
  dom.profileAccess.value = "public";
  enforceGroupAccess(dom.profileAccess, dom.profileGroup.value);
  dom.profileImageId.value = "";
  dom.profileDuration.value = formatDuration(120);
  updateProfileDurationPreview();

  // Get system timezone (simplified - assumes buildTimezones is available)
  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  dom.profileTimezone.value = systemTz;

  dom.profileDateMode.value = "both";
  dom.profileSendNotification.checked = true;
  state.profile.languages = ["eng"];
  state.profile.platforms = ["standalonewindows", "android"];
  state.profile.patterns = [];

  // Reset pattern type visibility (default is not annual, so show weekday, hide date)
  if (dom.patternType) dom.patternType.selectedIndex = 0; // Reset to first option
  if (dom.patternWeekdayField) dom.patternWeekdayField.classList.remove("is-hidden");
  if (dom.patternDateField) dom.patternDateField.classList.add("is-hidden");

  // Reset automation
  resetAutomationForm();
}

// Apply profile data to form
export function applyProfileToForm(groupId, profileKey) {
  const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
  if (!profile) {
    return;
  }
  setProfileMode("edit");
  state.profile.currentKey = profileKey;

  // Handle group selection
  if (!Array.from(dom.profileGroup.options).some(option => option.value === groupId)) {
    const option = document.createElement("option");
    option.value = groupId;
    option.textContent = `${getGroupName(groupId)} (no access)`;
    dom.profileGroup.appendChild(option);
  }

  dom.profileGroup.value = groupId;
  dom.profileDisplayName.value = getProfileLabel(profileKey, profile);
  dom.profileName.value = profile.name || "";
  dom.profileDescription.value = profile.description || "";
  dom.profileCategory.value = profile.category || "hangout";
  if (state.profile.tagInput) {
    state.profile.tagInput.setTags(profile.tags || []);
  } else {
    dom.profileTags.value = (profile.tags || []).join(", ");
  }
  dom.profileAccess.value = profile.accessType || "public";
  enforceGroupAccess(dom.profileAccess, groupId);
  state.profile.roleIds = Array.isArray(profile.roleIds) ? profile.roleIds.slice() : [];
  dom.profileImageId.value = profile.imageId || "";
  dom.profileDuration.value = formatDuration(profile.duration || 120);
  updateProfileDurationPreview();

  const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  dom.profileTimezone.value = profile.timezone || systemTz;

  dom.profileDateMode.value = profile.dateMode || "both";
  dom.profileSendNotification.checked = Boolean(profile.sendNotification);
  state.profile.languages = profile.languages ? profile.languages.slice() : [];
  state.profile.platforms = profile.platforms ? profile.platforms.slice() : [];
  state.profile.patterns = profile.patterns ? profile.patterns.slice() : [];

  // Apply automation settings
  applyAutomationToForm(profile.automation);
}

// Update profile action buttons visibility
export function updateProfileActionButtons() {
  const hasSelection = Boolean(dom.profileExisting.value);
  dom.profileEdit.classList.toggle("is-hidden", !hasSelection);
  dom.profileDelete.classList.toggle("is-hidden", !hasSelection);
  dom.profileEdit.disabled = !hasSelection;
  dom.profileDelete.disabled = !hasSelection;
}

// Render profile list for a selected group
export function renderProfileList(api) {
  const groupId = dom.profileGroup.value;
  const currentValue = dom.profileExisting.value;

  if (!groupId) {
    dom.profileExisting.innerHTML = "";
    const option = document.createElement("option");
    option.value = "";
    option.textContent = t("profiles.selectGroupFirst");
    dom.profileExisting.appendChild(option);
    dom.profileExisting.disabled = true;
    updateProfileActionButtons();
    return;
  }

  const groupData = state.profiles?.[groupId];
  const profiles = groupData?.profiles || {};
  const entries = Object.keys(profiles).map(profileKey => ({
    label: getProfileLabel(profileKey, profiles[profileKey]),
    value: `${groupId}::${profileKey}`
  }));

  dom.profileExisting.innerHTML = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = entries.length
    ? t("profiles.existingProfilePlaceholder")
    : t("profiles.noProfiles");
  dom.profileExisting.appendChild(placeholderOption);

  entries.forEach(entry => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    dom.profileExisting.appendChild(option);
  });

  if (currentValue && entries.some(entry => entry.value === currentValue)) {
    dom.profileExisting.value = currentValue;
  }

  dom.profileExisting.disabled = entries.length === 0;
  updateProfileActionButtons();
}

// Validate profile basic fields
export function validateProfileBasics() {
  const displayName = dom.profileDisplayName.value.trim();
  const eventName = dom.profileName.value.trim();
  const description = dom.profileDescription.value.trim();
  const missing = [];

  if (!displayName) {
    missing.push("Profile name");
  }
  if (!eventName) {
    missing.push("Event name");
  }
  if (!description) {
    missing.push("Description");
  }

  if (missing.length) {
    const verb = missing.length === 1 ? "is" : "are";
    return { valid: false, message: `${missing.join(", ")} ${verb} required.` };
  }

  return { valid: true };
}

// Handle profile wizard step change
export function handleProfileWizardStepChange({ current, next }) {
  if (next <= current) {
    return true;
  }

  if (current === 0 && next > 0) {
    if (!dom.profileGroup.value) {
      return { allowed: false, message: "Select a group first." };
    }
    if (!getProfileEditConfirmed()) {
      resetProfileForm();
      dom.profileExisting.value = "";
      updateProfileActionButtons();
    }
  }

  if (next > 1) {
    const validation = validateProfileBasics();
    if (!validation.valid) {
      return { allowed: false, message: validation.message };
    }
  }

  return true;
}

// Handle profile group change
export function handleProfileGroupChange(api) {
  setProfileEditConfirmed(false);
  state.profile.currentKey = null;
  resetProfileForm();
  enforceGroupAccess(dom.profileAccess, dom.profileGroup.value);
  dom.profileExisting.value = "";
  updateProfileActionButtons();
  void renderProfileRoleRestrictions(api);

  const wizard = getProfileWizard();
  if (wizard) {
    wizard.goTo(0);
  }
}

// Handle new profile button
export function handleProfileNew() {
  if (!dom.profileGroup.value) {
    return { success: false, message: "Select a group first." };
  }

  setProfileEditConfirmed(false);
  resetProfileForm();
  dom.profileExisting.value = "";
  updateProfileActionButtons();

  const wizard = getProfileWizard();
  if (wizard) {
    wizard.goTo(1);
  }

  return { success: true };
}

// Handle edit profile button
export function handleProfileEdit() {
  if (!dom.profileExisting.value) {
    return { success: false, message: "Select a profile to edit." };
  }

  setProfileEditConfirmed(true);

  const wizard = getProfileWizard();
  if (wizard) {
    wizard.goTo(1);
  }

  return { success: true };
}

// Handle profile selection change
export function handleProfileSelection(api) {
  setProfileEditConfirmed(false);
  const selected = dom.profileExisting.value;

  if (!selected) {
    resetProfileForm();
    updateProfileActionButtons();
    void renderProfileRoleRestrictions(api);
    return;
  }

  const [groupId, profileKey] = selected.split("::");
  applyProfileToForm(groupId, profileKey);
  updateProfileActionButtons();
  void renderProfileRoleRestrictions(api);
}

export function handleProfileAccessChange(api) {
  enforceGroupAccess(dom.profileAccess, dom.profileGroup.value);
  void renderProfileRoleRestrictions(api);
}

// Handle profile save
export async function handleProfileSave(api) {
  const groupId = dom.profileGroup.value;
  if (!groupId) {
    return { success: false, message: "Select a group." };
  }
  enforceGroupAccess(dom.profileAccess, groupId);

  const displayNameInput = dom.profileDisplayName.value.trim();
  const eventName = sanitizeText(dom.profileName.value, {
    maxLength: EVENT_NAME_LIMIT,
    allowNewlines: false,
    trim: true
  });
  dom.profileName.value = eventName;
  const description = sanitizeText(dom.profileDescription.value, {
    maxLength: EVENT_DESCRIPTION_LIMIT,
    allowNewlines: true,
    trim: true
  });
  dom.profileDescription.value = description;
  let profileKey = state.profile.currentKey;

  if (state.profile.mode !== "edit") {
    profileKey = buildProfileKey(groupId, displayNameInput, eventName);
  } else if (!profileKey) {
    const selected = dom.profileExisting.value;
    profileKey = selected ? selected.split("::")[1] : null;
  }

  if (!profileKey) {
    return { success: false, message: "Profile key could not be generated." };
  }

  state.profile.currentKey = profileKey;
  const displayName = displayNameInput || eventName || profileKey;

  if (state.profile.tagInput) {
    state.profile.tagInput.commit();
  }
  const tags = state.profile.tagInput
    ? state.profile.tagInput.getTags()
    : enforceTagsInput(dom.profileTags, TAG_LIMIT);

  if (state.profile.languages.length > 3) {
    return { success: false, message: "Maximum 3 languages allowed." };
  }

  let duration = parseDurationInput(dom.profileDuration.value)?.minutes ?? null;
  if (!duration) {
    duration = normalizeDurationInput(dom.profileDuration, 120);
  }
  if (!duration || duration < 1) {
    return { success: false, message: "Duration must be a positive number." };
  }

  const roleIds = dom.profileAccess.value === "group"
    ? (state.profile.roleIds || []).filter(id => typeof id === "string" && id.trim())
    : [];

  const profilePayload = {
    groupId,
    groupName: getGroupName(groupId),
    profileKey,
    data: {
      displayName,
      name: eventName,
      description,
      category: dom.profileCategory.value,
      languages: state.profile.languages.slice(),
      platforms: state.profile.platforms.slice(),
      tags,
      accessType: dom.profileAccess.value,
      roleIds,
      imageId: dom.profileImageId.value.trim() || null,
      duration,
      sendNotification: Boolean(dom.profileSendNotification.checked),
      timezone: dom.profileTimezone.value,
      dateMode: dom.profileDateMode.value,
      patterns: state.profile.patterns.slice(),
      automation: getAutomationFromForm()
    }
  };

  try {
    if (state.profile.mode === "edit") {
      await api.updateProfile(profilePayload);
      return {
        success: true,
        message: "Profile updated.",
        groupId,
        profileKey,
        wasEdit: true
      };
    } else {
      await api.createProfile(profilePayload);
      return {
        success: true,
        message: "Profile created.",
        groupId,
        profileKey,
        wasEdit: false
      };
    }
  } catch (err) {
    return {
      success: false,
      message: err?.message || "Could not save profile."
    };
  }
}

// Handle profile delete
export async function handleProfileDelete(api) {
  const selected = dom.profileExisting.value;
  if (!selected) {
    return { success: false, message: "No profile selected." };
  }

  const [groupId, profileKey] = selected.split("::");
  const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
  const label = getProfileLabel(profileKey, profile);

  const confirmDelete = window.confirm(`Delete profile "${label}"?`);
  if (!confirmDelete) {
    return { success: false, cancelled: true };
  }

  try {
    await api.deleteProfile({ groupId, profileKey });
    return {
      success: true,
      message: "Profile deleted."
    };
  } catch (err) {
    return {
      success: false,
      message: "Could not delete profile."
    };
  }
}

// Refresh profiles data
export async function refreshProfiles(api) {
  try {
    state.profiles = await api.getProfiles();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: "Failed to load profiles."
    };
  }
}
