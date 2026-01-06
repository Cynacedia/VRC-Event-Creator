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
  getGalleryFiles: payload => ipcRenderer.invoke("files:listGallery", payload),
  uploadGalleryImage: () => ipcRenderer.invoke("files:uploadGallery"),
  getAppInfo: () => ipcRenderer.invoke("app:info"),
  checkForUpdate: () => ipcRenderer.invoke("app:checkUpdate"),
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
  selectDataDir: () => ipcRenderer.invoke("app:selectDataDir")
});

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizeChange: callback => {
    ipcRenderer.on("window:maximized", (_, isMaximized) => callback(isMaximized));
  }
});
