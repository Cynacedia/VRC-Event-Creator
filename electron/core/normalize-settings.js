/**
 * Pure normalization for the user-settings object.
 *
 * Type-coerces every known field, drops any unknown ones, and supplies safe
 * defaults — the whitelist of fields here is the schema. Used by both load
 * and save paths in main.js so settings.json on disk can never carry stale
 * fields or wrong types into the running app.
 *
 * Pure functions: no fs, no Electron, no module state. Behavior must stay
 * byte-identical to the prior in-line versions in main.js — tests in
 * .dev/tests/core/normalize-settings.test.js lock this in.
 */

function normalizeCalendarReminders(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ value: 30, unit: "minutes" }];
  }
  const validUnits = ["minutes", "hours", "days"];
  const normalized = raw
    .filter(r => r && typeof r === "object" && typeof r.value === "number" && validUnits.includes(r.unit))
    .map(r => ({
      value: Math.max(1, Math.min(r.unit === "days" ? 7 : r.unit === "hours" ? 168 : 10080, Math.floor(r.value))),
      unit: r.unit
    }));
  return normalized.length ? normalized : [{ value: 30, unit: "minutes" }];
}

function normalizeSettings(raw) {
  // Only preserve the specific settings fields we define - ignore any other fields
  const validRanges = [7, 14, 30, 90, 180, 365];
  if (!raw || typeof raw !== "object") {
    return {
      warnConflicts: false,
      minimizeToTray: false,
      trayPromptShown: false,
      enableAdvanced: false,
      enableImportExport: false,
      autoUploadImages: false,
      startOnStartup: false,
      discordEnabled: false,
      calendarEnabled: false,
      calendarSaveDir: "",
      calendarReminders: [{ value: 30, unit: "minutes" }],
      modifyTimeRangeDays: 90
    };
  }
  return {
    warnConflicts: typeof raw.warnConflicts === "boolean" ? raw.warnConflicts : false,
    minimizeToTray: typeof raw.minimizeToTray === "boolean" ? raw.minimizeToTray : false,
    trayPromptShown: typeof raw.trayPromptShown === "boolean" ? raw.trayPromptShown : false,
    enableAdvanced: typeof raw.enableAdvanced === "boolean" ? raw.enableAdvanced : false,
    enableImportExport: typeof raw.enableImportExport === "boolean" ? raw.enableImportExport : false,
    autoUploadImages: typeof raw.autoUploadImages === "boolean" ? raw.autoUploadImages : false,
    startOnStartup: typeof raw.startOnStartup === "boolean" ? raw.startOnStartup : false,
    discordEnabled: typeof raw.discordEnabled === "boolean" ? raw.discordEnabled : false,
    calendarEnabled: typeof raw.calendarEnabled === "boolean" ? raw.calendarEnabled : false,
    calendarSaveDir: typeof raw.calendarSaveDir === "string" ? raw.calendarSaveDir : "",
    calendarReminders: normalizeCalendarReminders(raw.calendarReminders),
    modifyTimeRangeDays: validRanges.includes(raw.modifyTimeRangeDays) ? raw.modifyTimeRangeDays : 90
  };
}

module.exports = {
  normalizeSettings,
  normalizeCalendarReminders
};
