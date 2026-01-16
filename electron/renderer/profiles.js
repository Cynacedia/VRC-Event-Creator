// Profile management module
import { EVENT_DESCRIPTION_LIMIT, EVENT_NAME_LIMIT, TAG_LIMIT } from "./config.js";
import { dom, state, setProfileEditConfirmed, getProfileEditConfirmed, getProfileWizard } from "./state.js";
import { t } from "./i18n/index.js";
import { enforceTagsInput, sanitizeText, formatDuration, normalizeDurationInput, parseDurationInput, formatDurationPreview, enforceGroupAccess } from "./utils.js";
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

// Helper function to get unique display name for a group
export function getUniqueDisplayName(groupId, baseName) {
  const profiles = state.profiles?.[groupId]?.profiles || {};
  const existingNames = Object.values(profiles).map(p => (p.displayName || "").trim().toLowerCase());
  const baseNameLower = baseName.trim().toLowerCase();

  if (!existingNames.includes(baseNameLower)) {
    return baseName.trim();
  }

  let counter = 1;
  let nextName = `${baseName.trim()} - ${counter}`;
  while (existingNames.includes(nextName.toLowerCase())) {
    counter += 1;
    nextName = `${baseName.trim()} - ${counter}`;
  }
  return nextName;
}

// Helper function to get group name
export function getGroupName(groupId) {
  const group = (state.groups || []).find(item => item.groupId === groupId);
  return group ? group.name : "Unknown Group";
}

// Set profile mode (create or edit)
export function setProfileMode(mode) {
  state.profile.mode = mode;
  dom.profileGroup.disabled = false;
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

  // Update restorable count for the selected profile
  if (window.updateRestorableCount) {
    window.updateRestorableCount();
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
  let nthCount = 0;

  for (const p of patterns) {
    if (p.type === "every") {
      minDays = Math.min(minDays, 7);
    } else if (p.type === "every-other") {
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
  if (dom.automationRestore) {
    dom.automationRestore.disabled = true;
  }
  if (dom.automationRestoreCount) {
    dom.automationRestoreCount.textContent = "";
  }
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
  const hasGroup = Boolean(dom.profileGroup.value);
  dom.profileEdit.classList.toggle("is-hidden", !hasSelection);
  dom.profileDelete.classList.toggle("is-hidden", !hasSelection);
  dom.profileEdit.disabled = !hasSelection;
  dom.profileDelete.disabled = !hasSelection;
  // Import enabled when group selected, export enabled when profile selected
  if (dom.profileImportJson) {
    dom.profileImportJson.disabled = !hasGroup;
  }
  if (dom.profileExportJson) {
    dom.profileExportJson.disabled = !hasSelection;
  }
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

// Export profile to JSON
export async function handleProfileExportJson(api) {
  try {
    const selected = dom.profileExisting.value;
    if (!selected) {
      return { success: false, message: "No profile selected to export." };
    }

    const [groupId, profileKey] = selected.split("::");
    const profile = state.profiles?.[groupId]?.profiles?.[profileKey];
    if (!profile) {
      return { success: false, message: "Profile not found." };
    }

    const exportData = {
      displayName: profile.displayName || "",
      name: profile.name || "",
      description: profile.description || "",
      category: profile.category || "hangout",
      tags: profile.tags || [],
      accessType: profile.accessType || "public",
      roleIds: profile.roleIds || [],
      imageId: profile.imageId || "",
      sendNotification: profile.sendNotification ?? false,
      duration: profile.duration || 120,
      timezone: profile.timezone || "",
      languages: profile.languages || [],
      platforms: profile.platforms || [],
      dateMode: profile.dateMode || "manual",
      patterns: profile.patterns || [],
      automation: profile.automation || null
    };

    // Include base64 image if imageId is set
    if (exportData.imageId) {
      try {
        const imageData = await api.getImageAsBase64(exportData.imageId);
        if (imageData) {
          exportData.imageBase64 = imageData;
        }
      } catch (imgErr) {
        console.warn("Could not include image in profile export:", imgErr);
      }
    }

    const result = await api.exportProfileJson(exportData);
    if (!result) {
      return { success: false, message: "Export failed." };
    }
    if (result.cancelled) {
      return { success: false, cancelled: true };
    }
    if (!result.ok) {
      return { success: false, message: result.error?.message || "Could not export profile JSON." };
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message || "Export failed." };
  }
}

// Import profile from JSON
export async function handleProfileImportJson(api) {
  try {
    const result = await api.importProfileJson();
    if (!result) {
      return { success: false, message: "Import failed." };
    }
    if (result.cancelled) {
      return { success: false, cancelled: true };
    }
    if (!result.ok) {
      const errorMessage = result.error?.message || "Could not import profile JSON.";
      return { success: false, message: errorMessage };
    }
    return await applyImportedJsonToProfileForm(result.data, api);
  } catch (err) {
    return { success: false, message: err.message || "Import failed." };
  }
}

// Apply imported JSON data to profile form
async function applyImportedJsonToProfileForm(data, api) {
  if (!data || typeof data !== "object") {
    return { success: false, message: "Invalid JSON data." };
  }

  // Check if this looks like an event JSON instead of a profile JSON
  // Events have startDate/endDate/worldId - these fields don't exist in profiles
  const hasEventFields = data.startDate !== undefined || data.endDate !== undefined || data.worldId !== undefined;
  // Profiles must have displayName (required field unique to profiles)
  const hasProfileFields = data.displayName !== undefined;
  if (hasEventFields || !hasProfileFields) {
    return { success: false, message: t("profiles.importWrongType") || "This appears to be an event JSON. Please use Import Event instead." };
  }

  // Handle image - check if imageId exists in user's gallery first, otherwise upload base64
  const autoUpload = dom.settingsAutoUploadImages?.checked ?? false;
  if (data.imageId && typeof data.imageId === "string") {
    try {
      const imageExists = await api.checkGalleryImageExists(data.imageId);
      if (!imageExists && autoUpload && data.imageBase64 && typeof data.imageBase64 === "string") {
        const uploadResult = await api.uploadGalleryImageBase64(data.imageBase64);
        if (uploadResult?.ok && uploadResult?.data?.id) {
          data.imageId = uploadResult.data.id;
        }
      }
    } catch (imgErr) {
      console.warn("Could not check/upload imported profile image:", imgErr);
    }
  } else if (autoUpload && data.imageBase64 && typeof data.imageBase64 === "string") {
    try {
      const uploadResult = await api.uploadGalleryImageBase64(data.imageBase64);
      if (uploadResult?.ok && uploadResult?.data?.id) {
        data.imageId = uploadResult.data.id;
      }
    } catch (imgErr) {
      console.warn("Could not upload imported profile image:", imgErr);
    }
  }

  // Apply display name - ensure unique name within the selected group
  const selectedGroupId = dom.profileGroup.value;
  let displayName = (data.displayName && typeof data.displayName === "string")
    ? data.displayName.trim()
    : "";
  if (displayName && selectedGroupId) {
    displayName = getUniqueDisplayName(selectedGroupId, displayName);
  }
  dom.profileDisplayName.value = displayName;

  // Apply event name
  dom.profileName.value = (data.name && typeof data.name === "string")
    ? sanitizeText(data.name, {
        maxLength: EVENT_NAME_LIMIT,
        allowNewlines: false,
        trim: true
      })
    : "";

  // Apply description
  dom.profileDescription.value = (data.description && typeof data.description === "string")
    ? sanitizeText(data.description, {
        maxLength: EVENT_DESCRIPTION_LIMIT,
        allowNewlines: true,
        trim: true
      })
    : "";

  // Apply category
  const validCategories = ["hangout", "social", "gaming", "roleplay", "media", "music", "dance", "performance", "educational", "creative", "networking", "sports", "other"];
  if (data.category && validCategories.includes(data.category)) {
    dom.profileCategory.value = data.category;
  } else {
    dom.profileCategory.value = "hangout";
  }

  // Apply tags
  const tags = Array.isArray(data.tags)
    ? data.tags.filter(t => typeof t === "string").slice(0, TAG_LIMIT)
    : [];
  if (state.profile.tagInput) {
    state.profile.tagInput.setTags(tags);
  } else {
    dom.profileTags.value = tags.join(", ");
  }

  // Apply access type
  const validAccessTypes = ["public", "members", "group"];
  if (data.accessType && validAccessTypes.includes(data.accessType)) {
    dom.profileAccess.value = data.accessType;
  } else {
    dom.profileAccess.value = "public";
  }

  // Apply role IDs
  state.profile.roleIds = Array.isArray(data.roleIds)
    ? data.roleIds.filter(id => typeof id === "string" && id.trim())
    : [];

  // Apply image ID
  dom.profileImageId.value = (data.imageId && typeof data.imageId === "string")
    ? data.imageId.trim()
    : "";

  // Apply send notification
  dom.profileSendNotification.checked = typeof data.sendNotification === "boolean"
    ? data.sendNotification
    : false;

  // Apply duration
  if (typeof data.duration === "number" && data.duration > 0) {
    dom.profileDuration.value = formatDuration(data.duration);
  } else {
    dom.profileDuration.value = formatDuration(120);
  }
  updateProfileDurationPreview();

  // Apply timezone
  if (data.timezone && typeof data.timezone === "string") {
    dom.profileTimezone.value = data.timezone;
  }

  // Apply languages - only update if provided with valid non-empty values
  if (Array.isArray(data.languages)) {
    const validLanguages = data.languages.filter(l => typeof l === "string" && l.trim()).slice(0, 3);
    if (validLanguages.length > 0) {
      state.profile.languages = validLanguages;
    }
  }

  // Apply platforms - only update if provided with valid non-empty values
  if (Array.isArray(data.platforms)) {
    const validPlatforms = data.platforms.filter(p => typeof p === "string" && p.trim());
    if (validPlatforms.length > 0) {
      state.profile.platforms = validPlatforms;
    }
  }

  // Apply date mode
  const validDateModes = ["manual", "pattern"];
  if (data.dateMode && validDateModes.includes(data.dateMode)) {
    dom.profileDateMode.value = data.dateMode;
  }

  // Apply patterns
  if (Array.isArray(data.patterns)) {
    state.profile.patterns = data.patterns.filter(p => p && typeof p === "object");
  }

  // Apply automation settings
  if (data.automation && typeof data.automation === "object") {
    applyAutomationToForm(data.automation);
  }

  // Set up for new profile mode
  setProfileMode("new");
  state.profile.currentKey = null;
  dom.profileExisting.value = "";
  // Mark as confirmed so wizard navigation doesn't reset the form
  setProfileEditConfirmed(true);
  updateProfileActionButtons();

  // Re-render role restrictions if needed
  void renderProfileRoleRestrictions(api);

  // Return success with flag to update UI
  return { success: true, needsUiUpdate: true };
}
