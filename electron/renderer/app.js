// Main application entry point - imports and wires modular components

import { CATEGORIES, ACCESS_TYPES, LANGUAGES, PLATFORMS, DATE_MODES, PATTERN_TYPES, WEEKDAYS, TAG_LIMIT } from "./config.js";
import { dom, state, setEventWizard, setProfileWizard, getProfileEditConfirmed } from "./state.js";
import { setStatus, setFootMeta, showToast, setAuthState, setUpdateAvailable, setUpdateProgress, refreshStatusPill, showView, renderSelect, renderChecklist, setupWizard, bindWindowControls, initThemeControls, loadTheme, handleThemeChange, handleThemeReset, handleThemePresetSave, handleThemePresetDelete, handleThemePresetImport, handleThemePresetExport } from "./ui.js";
import { initI18n, setLanguage, getCurrentLanguage, getLanguageOptions, applyTranslations, t, getLanguageDisplayName } from "./i18n/index.js";
import { createTagInput, handleOpenDataDir, handleChangeDataDir, buildTimezones, normalizeDurationInput, sanitizeDurationInputValue, enforceGroupAccess, getTodayDateString, getMaxEventDateString } from "./utils.js";
import { checkSession, handleLogin, handleLoginClose, handleLogout, handleSettingsSave } from "./auth.js";
import { resetProfileForm, applyProfileToForm, renderProfileList, updateProfileActionButtons, handleProfileNew, handleProfileEdit, handleProfileDelete, handleProfileSelection, handleProfileGroupChange, handleProfileSave, updateProfileDurationPreview, handleProfileAccessChange, renderProfileRoleRestrictions } from "./profiles.js";
import { syncDateInputs, applyManualEventDefaults, handleEventGroupChange, handleEventProfileChange, handleEventCreate, handleEventAccessChange, renderEventRoleRestrictions, renderEventLanguageList, renderEventProfileOptions, renderEventPlatformList, updateDateOptions, refreshUpcomingEventCount, renderUpcomingEventCountLabel, updateEventDurationPreview } from "./events.js";
import { initGalleryPicker, openGalleryPicker } from "./gallery.js";
import { initModifyEvents, initModifySelects, refreshModifyEvents, syncModifyLocalization, updateModifyDurationPreview } from "./modify.js";

(() => {
  const api = window.vrcEvent;
  const windowControls = window.windowControls;
  if (!api) return;

  let languageOptions = [];
  let pendingAuthStart = false;
  const UPDATE_REPO_URL = "https://github.com/Cynacedia/VRC-Event-Creator";
  const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;
  let updateInfo = { available: false, downloaded: false, url: UPDATE_REPO_URL };
  let resyncInProgress = false;

  // Core app functions
  function renderGroupSelects(config = {}) {
    const { preserveSelection = false } = config;
    const currentEventGroup = dom.eventGroup.value;
    const currentProfileGroup = dom.profileGroup.value;
    const currentModifyGroup = dom.modifyGroup?.value;
    const groups = state.groups || [];
    const groupsWithAccess = groups.filter(g => g.canManageCalendar);
    const groupOptions = groupsWithAccess.map(g => ({ label: g.name, value: g.groupId }));
    const placeholder = groupOptions.length ? t("events.selectGroupPlaceholder") : t("common.noGroupsAccess");
    const profilePlaceholder = groupOptions.length ? t("profiles.selectGroupPlaceholder") : t("common.noGroupsAccess");
    renderSelect(dom.eventGroup, groupOptions, placeholder);
    renderSelect(dom.profileGroup, groupOptions, profilePlaceholder);
    if (dom.modifyGroup) {
      const modifyPlaceholder = groupOptions.length ? t("modify.selectGroupPlaceholder") : t("common.noGroupsAccess");
      renderSelect(dom.modifyGroup, groupOptions, modifyPlaceholder);
    }
    if (groupsWithAccess.length) {
      if (preserveSelection && currentEventGroup && groupsWithAccess.some(g => g.groupId === currentEventGroup)) {
        dom.eventGroup.value = currentEventGroup;
        state.event.selectedGroupId = currentEventGroup;
      } else {
        dom.eventGroup.value = groupsWithAccess[0].groupId;
        state.event.selectedGroupId = groupsWithAccess[0].groupId;
      }
      if (preserveSelection && currentProfileGroup && groupsWithAccess.some(g => g.groupId === currentProfileGroup)) {
        dom.profileGroup.value = currentProfileGroup;
      }
      if (dom.modifyGroup) {
        if (preserveSelection && currentModifyGroup && groupsWithAccess.some(g => g.groupId === currentModifyGroup)) {
          dom.modifyGroup.value = currentModifyGroup;
          state.modify.selectedGroupId = currentModifyGroup;
        } else {
          dom.modifyGroup.value = groupsWithAccess[0].groupId;
          state.modify.selectedGroupId = groupsWithAccess[0].groupId;
        }
      }
    } else {
      state.event.selectedGroupId = null;
      if (dom.modifyGroup) {
        state.modify.selectedGroupId = null;
      }
    }
  }

  function renderLanguageSelect() {
    if (!dom.settingsLanguage || !dom.languageMenu || !dom.languageLabel || !dom.languageFlag) {
      return;
    }
    languageOptions = getLanguageOptions();
    renderSelect(dom.settingsLanguage, languageOptions);
    dom.languageMenu.innerHTML = "";
    languageOptions.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-option";
      button.dataset.value = option.value;
      button.setAttribute("role", "option");
      const flag = document.createElement("span");
      flag.className = `flag-circle flag-${option.flag}`;
      flag.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = option.label;
      button.appendChild(flag);
      button.appendChild(label);
      dom.languageMenu.appendChild(button);
    });
    setLanguageSelection(getCurrentLanguage());
    renderLanguageSetupList();
  }

  function renderLanguageSetupList() {
    if (!dom.languageSetupList) {
      return;
    }
    const options = languageOptions.length ? languageOptions : getLanguageOptions();
    dom.languageSetupList.innerHTML = "";
    options.forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-setup-option";
      button.dataset.value = option.value;
      const flag = document.createElement("span");
      flag.className = `flag-circle flag-${option.flag}`;
      flag.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = option.label;
      if (option.value === getCurrentLanguage()) {
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        button.setAttribute("aria-pressed", "false");
      }
      button.appendChild(flag);
      button.appendChild(label);
      dom.languageSetupList.appendChild(button);
    });
  }

  function setLanguageSelection(langCode) {
    if (!languageOptions.length || !dom.settingsLanguage || !dom.languageLabel || !dom.languageFlag) {
      return;
    }
    const selected = languageOptions.find(option => option.value === langCode) || languageOptions[0];
    dom.settingsLanguage.value = selected.value;
    dom.languageLabel.textContent = selected.label;
    dom.languageFlag.className = `flag-circle flag-${selected.flag}`;
    if (dom.languageMenu) {
      dom.languageMenu.querySelectorAll(".language-option").forEach(optionEl => {
        const isSelected = optionEl.dataset.value === selected.value;
        optionEl.classList.toggle("is-selected", isSelected);
        optionEl.setAttribute("aria-selected", isSelected ? "true" : "false");
      });
    }
    renderLanguageSetupList();
  }

  function openLanguageMenu() {
    if (!dom.languageMenu || !dom.languageTrigger) {
      return;
    }
    dom.languageMenu.classList.remove("is-hidden");
    dom.languageTrigger.setAttribute("aria-expanded", "true");
  }

  function closeLanguageMenu() {
    if (!dom.languageMenu || !dom.languageTrigger) {
      return;
    }
    dom.languageMenu.classList.add("is-hidden");
    dom.languageTrigger.setAttribute("aria-expanded", "false");
  }

  function toggleLanguageMenu() {
    if (!dom.languageMenu) {
      return;
    }
    if (dom.languageMenu.classList.contains("is-hidden")) {
      openLanguageMenu();
    } else {
      closeLanguageMenu();
    }
  }

  function shouldShowLanguageSetup() {
    return Boolean(dom.languageOverlay) && !localStorage.getItem("languageConfirmed");
  }

  function showLanguageSetup() {
    if (!dom.languageOverlay) {
      return;
    }
    dom.languageOverlay.classList.remove("is-hidden");
    if (dom.loginOverlay) {
      dom.loginOverlay.classList.add("is-hidden");
    }
    if (dom.twoFactorOverlay) {
      dom.twoFactorOverlay.classList.add("is-hidden");
    }
    renderLanguageSetupList();
  }

  function hideLanguageSetup() {
    if (!dom.languageOverlay) {
      return;
    }
    dom.languageOverlay.classList.add("is-hidden");
  }

  async function startAuthFlow() {
    // Check session in background without blocking UI
    checkSession(api, refreshData).catch(() => {
      // Session check failed, user needs to login
    });
  }

  function completeLanguageSetup() {
    localStorage.setItem("languageConfirmed", "true");
    hideLanguageSetup();
    setAuthState(Boolean(state.user));
    if (pendingAuthStart) {
      pendingAuthStart = false;
      void startAuthFlow();
    }
  }

  async function refreshData(options = {}) {
    const { preserveSelection = false } = options;
    try {
      setFootMeta(t("common.syncing"));
      state.groups = await api.getGroups();
      state.profiles = await api.getProfiles();
      renderGroupSelects({ preserveSelection });
      enforceGroupAccess(dom.eventAccess, dom.eventGroup.value);
      enforceGroupAccess(dom.profileAccess, dom.profileGroup.value);
      if (dom.modifyEventAccess) {
        enforceGroupAccess(dom.modifyEventAccess, dom.modifyGroup?.value);
      }
      renderProfileList(api);
      renderEventProfileOptions(api);
      void renderEventRoleRestrictions(api);
      void renderProfileRoleRestrictions(api);
      await refreshUpcomingEventCount(api);
      setFootMeta(t("common.ready"));
      return true;
    } catch (err) {
      showToast("Failed to load profiles or groups.", true);
      setFootMeta(t("common.error"));
    }
    return false;
  }

  async function resyncUserData() {
    if (!state.user || resyncInProgress) {
      return;
    }
    resyncInProgress = true;
    if (dom.statusPill) {
      dom.statusPill.dataset.hover = "resync";
      dom.statusPill.textContent = "Syncing...";
      dom.statusPill.disabled = true;
      dom.statusPill.setAttribute("aria-disabled", "true");
    }
    const ok = await refreshData({ preserveSelection: true });
    if (ok) {
      showToast("Synced successfully.");
    }
    resyncInProgress = false;
    if (dom.statusPill) {
      delete dom.statusPill.dataset.hover;
    }
    refreshStatusPill();
  }

  function renderProfileLanguageList() {
    renderChecklist(dom.profileLanguageList, LANGUAGES, state.profile.languages, {
      max: 3,
      filterText: dom.profileLanguageFilter.value,
      getLabel: item => getLanguageDisplayName(item.value, item.label),
      onChange: next => {
        state.profile.languages = next;
        renderProfileLanguageList();
        dom.profileLanguageHint.textContent = t("profiles.languagesHint", { count: next.length });
      }
    });
    dom.profileLanguageHint.textContent = t("profiles.languagesHint", { count: state.profile.languages.length });
  }

  function renderProfilePlatformList() {
    renderChecklist(dom.profilePlatformList, PLATFORMS, state.profile.platforms, {
      onChange: next => {
        state.profile.platforms = next;
        renderProfilePlatformList();
      }
    });
  }

  function renderPatternList() {
    dom.patternList.innerHTML = "";
    if (!state.profile.patterns.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = t("profiles.patterns.noPatterns");
      dom.patternList.appendChild(empty);
      return;
    }
    state.profile.patterns.forEach((pattern, index) => {
      const row = document.createElement("div");
      row.className = "pattern-item";
      const label = document.createElement("span");
      label.textContent = formatPatternLabel(pattern);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = t("profiles.patterns.removeButton");
      remove.addEventListener("click", () => {
        state.profile.patterns.splice(index, 1);
        renderPatternList();
      });
      row.appendChild(label);
      row.appendChild(remove);
      dom.patternList.appendChild(row);
    });
  }

  function formatPatternLabel(pattern) {
    const weekdayKey = `common.weekdays.${pattern.weekday}`;
    const translatedWeekday = t(weekdayKey);
    const weekdayLabel = translatedWeekday === weekdayKey ? pattern.weekday : translatedWeekday;
    const time = `${String(pattern.hour).padStart(2, "0")}:${String(pattern.minute).padStart(2, "0")}`;
    if (pattern.type === "every") return t("profiles.patterns.format.every", { weekday: weekdayLabel, time });
    if (pattern.type === "every-other") return t("profiles.patterns.format.everyOther", { weekday: weekdayLabel, time });
    if (pattern.type === "last") return t("profiles.patterns.format.last", { weekday: weekdayLabel, time });
    if (pattern.type === "nth") {
      const ordinalKey = `profiles.patterns.ordinal${pattern.occurrence}`;
      const ordinal = t(ordinalKey);
      return t("profiles.patterns.format.nth", {
        ordinal: ordinal === ordinalKey ? `${pattern.occurrence}` : ordinal,
        weekday: weekdayLabel,
        time
      });
    }
    return t("profiles.patterns.format.every", { weekday: weekdayLabel, time });
  }

  function refreshLocalizedUi() {
    const selections = {
      eventCategory: dom.eventCategory.value,
      profileCategory: dom.profileCategory.value,
      eventAccess: dom.eventAccess.value,
      profileAccess: dom.profileAccess.value,
      modifyCategory: dom.modifyEventCategory?.value,
      modifyAccess: dom.modifyEventAccess?.value,
      profileDateMode: dom.profileDateMode.value,
      patternType: dom.patternType.value,
      patternWeekday: dom.patternWeekday.value
    };

    renderGroupSelects({ preserveSelection: true });
    renderSelect(dom.eventCategory, CATEGORIES);
    if (selections.eventCategory) {
      dom.eventCategory.value = selections.eventCategory;
    }
    renderSelect(dom.profileCategory, CATEGORIES);
    if (selections.profileCategory) {
      dom.profileCategory.value = selections.profileCategory;
    }
    renderSelect(dom.eventAccess, ACCESS_TYPES);
    if (selections.eventAccess) {
      dom.eventAccess.value = selections.eventAccess;
    }
    enforceGroupAccess(dom.eventAccess, dom.eventGroup.value);
    renderSelect(dom.profileAccess, ACCESS_TYPES);
    if (selections.profileAccess) {
      dom.profileAccess.value = selections.profileAccess;
    }
    enforceGroupAccess(dom.profileAccess, dom.profileGroup.value);
    if (dom.modifyEventCategory) {
      renderSelect(dom.modifyEventCategory, CATEGORIES);
      if (selections.modifyCategory) {
        dom.modifyEventCategory.value = selections.modifyCategory;
      }
    }
    if (dom.modifyEventAccess) {
      renderSelect(dom.modifyEventAccess, ACCESS_TYPES);
      if (selections.modifyAccess) {
        dom.modifyEventAccess.value = selections.modifyAccess;
      }
      enforceGroupAccess(dom.modifyEventAccess, dom.modifyGroup?.value);
    }
    renderSelect(dom.profileDateMode, DATE_MODES);
    if (selections.profileDateMode) {
      dom.profileDateMode.value = selections.profileDateMode;
    }
    renderSelect(dom.patternType, PATTERN_TYPES, t("profiles.patterns.selectPattern"));
    if (selections.patternType) {
      dom.patternType.value = selections.patternType;
    }
    renderSelect(dom.patternWeekday, WEEKDAYS, t("profiles.patterns.selectWeekday"));
    if (selections.patternWeekday) {
      dom.patternWeekday.value = selections.patternWeekday;
    }

    renderProfileList(api);
    renderEventProfileOptions(api);
    void renderEventRoleRestrictions(api);
      renderEventLanguageList();
      renderEventPlatformList();
      renderProfileLanguageList();
      renderProfilePlatformList();
      void renderProfileRoleRestrictions(api);
      renderPatternList();
      renderUpcomingEventCountLabel();
      syncModifyLocalization();

    const profileKey = dom.eventProfile.value;
    const groupId = dom.eventGroup.value;
    const profile = profileKey && profileKey !== "__manual__"
      ? state.profiles?.[groupId]?.profiles?.[profileKey]
      : null;
    updateDateOptions(api, profile);

    if (state.user) {
      setStatus(t("auth.loggedInAs", { name: state.user.displayName || "user" }));
    }
    updateEventDurationPreview();
    updateProfileDurationPreview();
    updateModifyDurationPreview();
  }

  function handlePatternAdd() {
    const type = dom.patternType.value;
    const weekday = dom.patternWeekday.value;
    const time = dom.patternTime.value;
    if (!type || !weekday || !time) {
      showToast(t("profiles.patterns.selectAll"), true);
      return;
    }
    const [hourStr, minuteStr] = time.split(":");
    const pattern = { type: ["every", "every-other"].includes(type) ? type : "nth", weekday, hour: Number(hourStr), minute: Number(minuteStr) };
    if (type === "last") pattern.type = "last";
    else if (["1st", "2nd", "3rd", "4th"].includes(type)) pattern.occurrence = Number(type[0]);
    state.profile.patterns.push(pattern);
    renderPatternList();
  }

  function handlePatternClear() {
    if (!state.profile.patterns.length) return;
    if (!window.confirm(t("profiles.patterns.confirmClear"))) return;
    state.profile.patterns = [];
    renderPatternList();
  }

  function handleEventWizardStepChange({ current, next }) {
    if (next < current) {
      return true;
    }
    if (next > 1 && current <= 1) {
      const usePattern = state.event.dateSource === "pattern";
      if (usePattern) {
        if (!dom.eventDateOption.value) {
          showToast(t("events.selectDateError"), true);
          return false;
        }
      } else if (!dom.eventManualDate.value || !dom.eventManualTime.value) {
        showToast(t("events.selectDateError"), true);
        return false;
      }
    }
    if (next > 2 && current <= 2) {
      const missing = [];
      if (!dom.eventName.value.trim()) {
        missing.push(t("events.eventName"));
      }
      if (!dom.eventDescription.value.trim()) {
        missing.push(t("events.description"));
      }
      if (missing.length) {
        const key = missing.length === 1 ? "events.requiredSingle" : "events.requiredMultiple";
        showToast(t(key, { field: missing[0], fields: missing.join(", ") }), true);
        return false;
      }
    }
    return true;
  }

  function handleProfileWizardStepChange({ current, next }) {
    // Going backward - allow and keep group/profile selection on step 0
      if (next < current) {
        if (next === 0) {
          // Returning to step 0 - keep group selected, unlock it, refresh profile list
          const currentGroup = dom.profileGroup.value;
          resetProfileForm();
        if (currentGroup) {
          dom.profileGroup.value = currentGroup;
          renderProfileList(api);
        }
          updateProfileActionButtons();
          renderProfileLanguageList();
          renderProfilePlatformList();
          void renderProfileRoleRestrictions(api);
          renderPatternList();
        }
        return true;
      }
    // Going forward from step 0
    if (current === 0 && next > 0) {
      if (!dom.profileGroup.value) {
        showToast(t("profiles.selectGroupFirst"), true);
        return false;
      }
      // If a profile is selected, auto-enter edit mode
      const selectedProfile = dom.profileExisting.value;
      if (selectedProfile) {
        const [groupId, profileKey] = selectedProfile.split("::");
        if (groupId && profileKey) {
          applyProfileToForm(groupId, profileKey);
          updateProfileActionButtons();
          renderProfileLanguageList();
          renderProfilePlatformList();
          void renderProfileRoleRestrictions(api);
          renderPatternList();
        }
      } else if (!getProfileEditConfirmed()) {
        // No profile selected and not in edit mode - reset for new profile
        resetProfileForm();
        dom.profileExisting.value = "";
        updateProfileActionButtons();
        renderProfileLanguageList();
        renderProfilePlatformList();
        void renderProfileRoleRestrictions(api);
        renderPatternList();
      }
    }
    // Validate basics before moving to patterns
    if (next > 1) {
      const displayName = dom.profileDisplayName.value.trim();
      const eventName = dom.profileName.value.trim();
      const description = dom.profileDescription.value.trim();
      const missing = [];
      if (!displayName) missing.push(t("profiles.displayName"));
      if (!eventName) missing.push(t("profiles.eventName"));
      if (!description) missing.push(t("profiles.description"));
      if (missing.length) {
        const key = missing.length === 1 ? "profiles.requiredSingle" : "profiles.requiredMultiple";
        showToast(t(key, { field: missing[0], fields: missing.join(", ") }), true);
        return false;
      }
    }
    return true;
  }

  function handleDateSourceChange(event) {
    if (!event.target.value) return;
    state.event.dateSource = event.target.value;
    syncDateInputs();
  }

  async function checkForUpdates() {
    if (!api.checkForUpdate) {
      return;
    }
    try {
      const result = await api.checkForUpdate();
      if (!result || typeof result.updateAvailable !== "boolean") {
        return;
      }
      updateInfo = {
        available: Boolean(result.updateAvailable),
        downloaded: Boolean(result.updateDownloaded),
        downloading: Boolean(result.updateDownloading),
        progress: result.updateProgress || 0,
        url: result.repoUrl || UPDATE_REPO_URL
      };
      state.app.updateAvailable = updateInfo.available;
      setUpdateAvailable(updateInfo.available, updateInfo.downloaded);
      if (updateInfo.downloading) {
        setUpdateProgress(updateInfo.progress, true);
      }
      setAuthState(Boolean(state.user));
    } catch (err) {
      // Ignore update check failures.
    }
  }

  function bindEvents() {
    dom.navButtons.forEach(btn => btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      showView(view);
      // Refresh profile list when navigating to profiles view
      if (view === "profiles") {
        renderProfileList(api);
      }
      if (view === "modify") {
        if (state.app?.updateAvailable) {
          showToast(t("modify.updateRequired"), true, { duration: 8000 });
        }
        void refreshModifyEvents(api);
      }
    }));
    dom.loginForm.addEventListener("submit", e => handleLogin(e, api, refreshData));
    dom.loginClose.addEventListener("click", () => handleLoginClose(api));
    dom.logoutBtn.addEventListener("click", () => handleLogout(api));
    dom.settingsSave.addEventListener("click", handleSettingsSave);
    dom.settingsTheme.addEventListener("change", handleThemeChange);
    dom.themeReset.addEventListener("click", handleThemeReset);
    dom.themePresetSave.addEventListener("click", handleThemePresetSave);
    dom.themePresetDelete.addEventListener("click", handleThemePresetDelete);
    if (dom.themePresetImport) {
      dom.themePresetImport.addEventListener("click", handleThemePresetImport);
    }
    if (dom.themePresetExport) {
      dom.themePresetExport.addEventListener("click", handleThemePresetExport);
    }
    if (dom.githubLink && api.openExternal) {
      dom.githubLink.addEventListener("click", event => {
        event.preventDefault();
        api.openExternal(dom.githubLink.href);
      });
    }
    if (dom.statusPill) {
      dom.statusPill.addEventListener("mouseenter", () => {
        if (!updateInfo.available && state.user && !resyncInProgress) {
          dom.statusPill.dataset.hover = "resync";
          dom.statusPill.textContent = "Resync";
        }
      });
      dom.statusPill.addEventListener("mouseleave", () => {
        if (!updateInfo.available && state.user && !resyncInProgress) {
          delete dom.statusPill.dataset.hover;
          refreshStatusPill();
        }
      });
      dom.statusPill.addEventListener("click", async () => {
        if (!updateInfo.available) {
          await resyncUserData();
          return;
        }
        if (updateInfo.downloaded && api.installUpdate) {
          // Update is downloaded, restart to install
          api.installUpdate();
        } else {
          // Update is still downloading, check again and show status
          await checkForUpdates();
          if (updateInfo.downloaded && api.installUpdate) {
            api.installUpdate();
          } else {
            showToast(t("common.updateDownloading") || "Downloading update...");
          }
        }
      });
    }
    if (dom.languageTrigger && dom.languageMenu) {
      dom.languageTrigger.addEventListener("click", event => {
        event.stopPropagation();
        toggleLanguageMenu();
      });
      dom.languageMenu.addEventListener("click", async event => {
        const option = event.target.closest(".language-option");
        if (!option) {
          return;
        }
        const nextLang = option.dataset.value;
        if (!nextLang) {
          return;
        }
        await setLanguage(nextLang);
        setLanguageSelection(nextLang);
        applyTranslations();
        setAuthState(Boolean(state.user));
        refreshLocalizedUi();
        document.documentElement.lang = getCurrentLanguage();
        closeLanguageMenu();
      });
      document.addEventListener("click", event => {
        if (dom.languageSelect && dom.languageSelect.contains(event.target)) {
          return;
        }
        closeLanguageMenu();
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          closeLanguageMenu();
        }
      });
    }
    if (dom.languageSetupList) {
      dom.languageSetupList.addEventListener("click", async event => {
        const option = event.target.closest(".language-setup-option");
        if (!option) {
          return;
        }
        const nextLang = option.dataset.value;
        if (!nextLang) {
          return;
        }
        await setLanguage(nextLang);
        setLanguageSelection(nextLang);
        applyTranslations();
        setAuthState(Boolean(state.user));
        refreshLocalizedUi();
        document.documentElement.lang = getCurrentLanguage();
      });
    }
    if (dom.languageSetupContinue) {
      dom.languageSetupContinue.addEventListener("click", () => completeLanguageSetup());
    }
    if (dom.themeOpen && dom.themeOverlay) {
      const closeThemeOverlay = () => dom.themeOverlay.classList.add("is-hidden");
      dom.themeOpen.addEventListener("click", () => dom.themeOverlay.classList.remove("is-hidden"));
      if (dom.themeOverlayClose) {
        dom.themeOverlayClose.addEventListener("click", closeThemeOverlay);
      }
      dom.themeOverlay.addEventListener("click", event => {
        if (event.target === dom.themeOverlay) {
          closeThemeOverlay();
        }
      });
    }
    dom.settingsOpenDir.addEventListener("click", () => handleOpenDataDir(api));
    dom.settingsChangeDir.addEventListener("click", () => handleChangeDataDir(api));
    dom.eventGroup.addEventListener("change", () => { void handleEventGroupChange(api); });
    dom.eventProfile.addEventListener("change", () => handleEventProfileChange(api));
    dom.eventProfileClear.addEventListener("click", () => { dom.eventProfile.value = "__manual__"; handleEventProfileChange(api); });
    dom.eventAccess.addEventListener("change", () => handleEventAccessChange(api));
    dom.eventDateSource.addEventListener("change", handleDateSourceChange);
    dom.eventTimezone.addEventListener("change", () => {
      if (!state.event.profile) {
        return;
      }
      void updateDateOptions(api, state.event.profile);
    });
    dom.eventManualDate.addEventListener("blur", () => {
      const selectedDate = dom.eventManualDate.value;
      if (selectedDate) {
        const today = getTodayDateString();
        const maxDate = getMaxEventDateString();
        if (selectedDate < today) {
          showToast(t("events.pastDateError"), true);
          dom.eventManualDate.value = today;
        } else if (selectedDate > maxDate) {
          showToast(t("events.futureDateError"), true);
          dom.eventManualDate.value = maxDate;
        }
      }
    });
    dom.eventManualTime.addEventListener("input", () => {
      const value = dom.eventManualTime.value;
      if (!value) {
        return;
      }
      const [hours, minutes] = value.split(":");
      if (hours === "00" && minutes) {
        dom.eventManualTime.value = `00:${minutes}`;
      }
    });
    if (dom.eventDuration) {
      dom.eventDuration.addEventListener("input", () => {
        dom.eventDuration.value = sanitizeDurationInputValue(dom.eventDuration.value);
        updateEventDurationPreview();
      });
      dom.eventDuration.addEventListener("blur", () => {
        normalizeDurationInput(dom.eventDuration, 120);
        updateEventDurationPreview();
      });
      updateEventDurationPreview();
    }
    dom.eventLanguageFilter.addEventListener("input", renderEventLanguageList);
    dom.eventCreate.addEventListener("click", () => handleEventCreate(api).then(result => {
      if (!result) {
        return;
      }
      if (result.success) {
        showToast(result.message);
        return;
      }
      if (!result.toastShown && result.message) {
        showToast(result.message, true);
      }
    }));
    if (dom.eventCountRefresh) {
      dom.eventCountRefresh.addEventListener("click", () => { void refreshUpcomingEventCount(api); });
    }
    if (dom.eventImagePicker) {
      dom.eventImagePicker.addEventListener("click", () => openGalleryPicker(dom.eventImageId));
    }
    if (dom.modifyEventImagePicker) {
      dom.modifyEventImagePicker.addEventListener("click", () => openGalleryPicker(dom.modifyEventImageId));
    }
      dom.profileGroup.addEventListener("change", () => { handleProfileGroupChange(api); renderProfileList(api); });
      dom.profileExisting.addEventListener("change", () => handleProfileSelection(api));
      dom.profileNew.addEventListener("click", () => { const r = handleProfileNew(); if (!r.success && r.message) showToast(r.message, true); });
      dom.profileEdit.addEventListener("click", () => { const r = handleProfileEdit(); if (!r.success && r.message) showToast(r.message, true); });
    dom.profileDelete.addEventListener("click", async () => { const r = await handleProfileDelete(api); if (r.success) { showToast(r.message); await refreshData(); resetProfileForm(); renderProfileLanguageList(); renderProfilePlatformList(); renderPatternList(); void renderProfileRoleRestrictions(api); } else if (!r.cancelled) showToast(r.message, true); });
      dom.profileSave.addEventListener("click", async () => { const r = await handleProfileSave(api); if (r.success) { showToast(r.message); await refreshData(); renderProfileList(api); dom.profileExisting.value = `${r.groupId}::${r.profileKey}`; applyProfileToForm(r.groupId, r.profileKey); updateProfileActionButtons(); renderProfileLanguageList(); renderProfilePlatformList(); renderPatternList(); await renderProfileRoleRestrictions(api); } else showToast(r.message, true); });
      dom.profileLanguageFilter.addEventListener("input", renderProfileLanguageList);
      dom.profileAccess.addEventListener("change", () => handleProfileAccessChange(api));
    if (dom.profileDuration) {
      dom.profileDuration.addEventListener("input", () => {
        dom.profileDuration.value = sanitizeDurationInputValue(dom.profileDuration.value);
        updateProfileDurationPreview();
      });
      dom.profileDuration.addEventListener("blur", () => {
        normalizeDurationInput(dom.profileDuration, 120);
        updateProfileDurationPreview();
      });
      updateProfileDurationPreview();
    }
    dom.profileDateMode.addEventListener("change", () => { dom.patternType.disabled = dom.profileDateMode.value === "manual"; dom.patternWeekday.disabled = dom.profileDateMode.value === "manual"; dom.patternTime.disabled = dom.profileDateMode.value === "manual"; dom.patternAdd.disabled = dom.profileDateMode.value === "manual"; dom.patternClear.disabled = dom.profileDateMode.value === "manual"; dom.patternList.classList.toggle("is-disabled", dom.profileDateMode.value === "manual"); });
    dom.patternAdd.addEventListener("click", handlePatternAdd);
    dom.patternClear.addEventListener("click", handlePatternClear);
    if (dom.profileImagePicker) {
      dom.profileImagePicker.addEventListener("click", () => openGalleryPicker(dom.profileImageId));
    }
    dom.twoFactorForm.addEventListener("submit", e => { e.preventDefault(); const code = dom.twoFactorCode.value.trim(); if (!code) { showToast("Enter your code.", true); return; } api.submitTwoFactor(code); dom.twoFactorCode.value = ""; dom.twoFactorOverlay.classList.add("is-hidden"); });
    bindWindowControls(windowControls);
  }

  async function init() {
    await initI18n();
    document.documentElement.lang = getCurrentLanguage();
    renderLanguageSelect();
    applyTranslations();
    setAuthState(false);
    renderUpcomingEventCountLabel();
    initThemeControls();
    initGalleryPicker(api);
    initModifyEvents(api);
    await loadTheme(api);
    renderSelect(dom.eventCategory, CATEGORIES);
    renderSelect(dom.profileCategory, CATEGORIES);
    renderSelect(dom.eventAccess, ACCESS_TYPES);
    renderSelect(dom.profileAccess, ACCESS_TYPES);
    renderSelect(dom.profileDateMode, DATE_MODES);
    renderSelect(dom.patternType, PATTERN_TYPES, t("profiles.patterns.selectPattern"));
    renderSelect(dom.patternWeekday, WEEKDAYS, t("profiles.patterns.selectWeekday"));
    initModifySelects();
    const { list, systemTz } = buildTimezones();
    renderSelect(dom.profileTimezone, list);
    renderSelect(dom.eventTimezone, list);
    dom.profileTimezone.value = systemTz;
    dom.eventTimezone.value = systemTz;
    state.profile.tagInput = createTagInput({
      inputEl: dom.profileTags,
      chipContainer: dom.profileTagsChips,
      wrapperEl: dom.profileTagsInput,
      maxTags: TAG_LIMIT
    });
    state.event.tagInput = createTagInput({
      inputEl: dom.eventTags,
      chipContainer: dom.eventTagsChips,
      wrapperEl: dom.eventTagsInput,
      maxTags: TAG_LIMIT
    });
    resetProfileForm();
    renderProfileLanguageList();
    renderProfilePlatformList();
    void renderProfileRoleRestrictions(api);
    renderPatternList();
    applyManualEventDefaults();
    void renderEventRoleRestrictions(api);
    // Set date range to today through one year from now.
    const today = getTodayDateString();
    const maxDate = getMaxEventDateString();
    dom.eventManualDate.min = today;
    dom.eventManualDate.max = maxDate;
    setEventWizard(setupWizard({
      wizardId: "event-wizard",
      stepsId: "event-steps",
      backButton: dom.eventBack,
      nextButton: dom.eventNext,
      beforeStepChange: handleEventWizardStepChange
    }));
    setProfileWizard(setupWizard({ wizardId: "profile-wizard", stepsId: "profile-steps", backButton: dom.profileBack, nextButton: dom.profileNext, beforeStepChange: handleProfileWizardStepChange }));
    api.onTwoFactorRequired(() => { dom.twoFactorOverlay.classList.remove("is-hidden"); dom.twoFactorCode.focus(); });
    const info = await api.getAppInfo();
    if (info) {
      dom.aboutVersion.textContent = info.version || "-";
      dom.aboutDataDir.textContent = info.dataDir || "-";
    }
    await checkForUpdates();
    window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
    if (api.onUpdateProgress) {
      api.onUpdateProgress((data) => {
        updateInfo.downloading = true;
        updateInfo.progress = data.percent || 0;
        setUpdateProgress(data.percent || 0, true);
      });
    }
    if (api.onUpdateReady) {
      api.onUpdateReady(() => {
        updateInfo.downloaded = true;
        updateInfo.downloading = false;
        setUpdateAvailable(updateInfo.available, true);
      });
    }
    pendingAuthStart = true;
    showView("create");
    if (shouldShowLanguageSetup()) {
      showLanguageSetup();
    } else {
      pendingAuthStart = false;
      await startAuthFlow();
    }
  }

  bindEvents();
  init().catch(() => showToast("Failed to initialize app.", true));
})();
