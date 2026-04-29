const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vrcEvent", {
  getCurrentUser: () => ipcRenderer.invoke("auth:getCurrentUser"),
  login: credentials => ipcRenderer.invoke("auth:login", credentials),
  logout: () => ipcRenderer.invoke("auth:logout"),
  onTwoFactorRequired: callback => {
    ipcRenderer.on("auth:twofactor", () => callback());
  },
  submitTwoFactor: code => ipcRenderer.invoke("auth:twofactor:submit", code),
  getGroups: () => ipcRenderer.invoke("groups:list"),
  getGroupRoles: payload => ipcRenderer.invoke("groups:roles", payload),
  checkFeatureFlags: groupId => ipcRenderer.invoke("groups:checkFeatureFlags", groupId),
  getProfiles: () => ipcRenderer.invoke("profiles:list"),
  createProfile: payload => ipcRenderer.invoke("profiles:create", payload),
  updateProfile: payload => ipcRenderer.invoke("profiles:update", payload),
  deleteProfile: payload => ipcRenderer.invoke("profiles:delete", payload),
  getDateOptions: payload => ipcRenderer.invoke("dates:options", payload),
  prepareEvent: payload => ipcRenderer.invoke("events:prepare", payload),
  createEvent: payload => ipcRenderer.invoke("events:create", payload),
  getUpcomingEventCount: payload => ipcRenderer.invoke("events:countUpcoming", payload),
  listGroupEvents: payload => ipcRenderer.invoke("events:listGroup", payload),
  updateEvent: payload => ipcRenderer.invoke("events:update", payload),
  deleteEvent: payload => ipcRenderer.invoke("events:delete", payload),
  importEventJson: () => ipcRenderer.invoke("events:importJson"),
  exportEventJson: data => ipcRenderer.invoke("events:exportJson", data),
  importProfileJson: () => ipcRenderer.invoke("profiles:importJson"),
  exportProfileJson: data => ipcRenderer.invoke("profiles:exportJson", data),
  getGalleryFiles: payload => ipcRenderer.invoke("files:listGallery", payload),
  uploadGalleryImage: () => ipcRenderer.invoke("files:uploadGallery"),
  uploadGalleryImageBase64: base64Data => ipcRenderer.invoke("files:uploadGalleryBase64", { base64Data }),
  getCachedImage: imageId => ipcRenderer.invoke("gallery:getCachedImage", { imageId }),
  getImageAsBase64: imageId => ipcRenderer.invoke("gallery:getImageAsBase64", { imageId }),
  checkGalleryImageExists: imageId => ipcRenderer.invoke("gallery:checkImageExists", { imageId }),
  getCacheStatus: imageIds => ipcRenderer.invoke("gallery:getCacheStatus", { imageIds }),
  cleanGalleryCache: maxAgeDays => ipcRenderer.invoke("gallery:cleanCache", { maxAgeDays }),
  triggerBackgroundCache: images => ipcRenderer.invoke("gallery:triggerBackgroundCache", { images }),
  getAppInfo: () => ipcRenderer.invoke("app:info"),
  checkForUpdate: () => ipcRenderer.invoke("app:checkUpdate"),
  downloadUpdate: () => ipcRenderer.invoke("app:downloadUpdate"),
  installUpdate: () => ipcRenderer.invoke("app:installUpdate"),
  onUpdateReady: callback => {
    ipcRenderer.on("update-ready", (_, data) => callback(data));
  },
  onUpdateProgress: callback => {
    ipcRenderer.on("update-progress", (_, data) => callback(data));
  },
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: payload => ipcRenderer.invoke("settings:set", payload),
  getThemeStore: () => ipcRenderer.invoke("theme:get"),
  saveThemeStore: payload => ipcRenderer.invoke("theme:set", payload),
  getThemePresets: () => ipcRenderer.invoke("themePresets:get"),
  saveThemePreset: payload => ipcRenderer.invoke("themePresets:save", payload),
  deleteThemePreset: key => ipcRenderer.invoke("themePresets:delete", key),
  importThemePreset: () => ipcRenderer.invoke("themePresets:import"),
  exportThemePreset: payload => ipcRenderer.invoke("themePresets:export", payload),
  quitApp: () => ipcRenderer.invoke("app:quit"),
  openExternal: url => ipcRenderer.invoke("app:openExternal", url),
  openDataDir: () => ipcRenderer.invoke("app:openDataDir"),
  selectDataDir: () => ipcRenderer.invoke("app:selectDataDir"),

  // Pending Events & Automation
  getPendingEvents: payload => ipcRenderer.invoke("pending:list", payload),
  pendingAction: payload => ipcRenderer.invoke("pending:action", payload),
  getPendingSettings: () => ipcRenderer.invoke("pending:getSettings"),
  updatePendingSettings: payload => ipcRenderer.invoke("pending:updateSettings", payload),
  getAutomationStatus: payload => ipcRenderer.invoke("automation:getStatus", payload),
  resolveAutomationEvent: payload => ipcRenderer.invoke("automation:resolveEvent", payload),
  restoreDeletedEvents: payload => ipcRenderer.invoke("automation:restore", payload),
  getRestorableCount: payload => ipcRenderer.invoke("automation:getRestorableCount", payload),
  onAutomationMissed: callback => {
    ipcRenderer.on("automation:missed", (_, data) => callback(data));
  },
  onAutomationCreated: callback => {
    ipcRenderer.on("automation:created", (_, data) => callback(data));
  },
  onProfilesUpdated: callback => {
    ipcRenderer.on("profiles:updated", (_, data) => callback(data));
  },

  // Discord integration
  discordTestConnection: botToken => ipcRenderer.invoke("discord:testConnection", botToken),
  discordUpdateGroupDiscord: payload => ipcRenderer.invoke("discord:updateGroupDiscord", payload),
  discordGetGroupDiscord: groupId => ipcRenderer.invoke("discord:getGroupDiscord", groupId),
  onDiscordSyncFailed: callback => {
    ipcRenderer.on("discord:syncFailed", (_, data) => callback(data));
  },
  onDiscordSyncSuccess: callback => {
    ipcRenderer.on("discord:syncSuccess", (_, data) => callback(data));
  },

  // Calendar / Webhook integration
  webhookTest: webhookUrl => ipcRenderer.invoke("webhook:test", webhookUrl),
  webhookUpdateGroupWebhook: payload => ipcRenderer.invoke("webhook:updateGroupWebhook", payload),
  webhookGetGroupWebhook: groupId => ipcRenderer.invoke("webhook:getGroupWebhook", groupId),
  calendarSaveIcs: payload => ipcRenderer.invoke("calendar:generateAndSave", payload),
  calendarSelectSaveDir: () => ipcRenderer.invoke("calendar:selectSaveDir"),

  // EC Kit (webhook identity)
  eckitImport: () => ipcRenderer.invoke("eckit:import"),
  eckitHasKit: groupId => ipcRenderer.invoke("eckit:hasKit", groupId),
  eckitGetKit: groupId => ipcRenderer.invoke("eckit:getKit", groupId),
  eckitGetKitGroupIds: () => ipcRenderer.invoke("eckit:getKitGroupIds"),
  eckitSelectImage: () => ipcRenderer.invoke("eckit:selectImage"),

  onWebhookSyncFailed: callback => {
    ipcRenderer.on("webhook:syncFailed", (_, data) => callback(data));
  },
  onWebhookSyncSuccess: callback => {
    ipcRenderer.on("webhook:syncSuccess", (_, data) => callback(data));
  },
  onCalendarAutoSaved: callback => {
    ipcRenderer.on("calendar:autoSaved", (_, data) => callback(data));
  }
});

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: callback => {
    ipcRenderer.on("window:maximized", (_, isMaximized) => callback(isMaximized));
  },
  onShowTrayPrompt: callback => {
    ipcRenderer.on("window:show-tray-prompt", () => callback());
  }
});
