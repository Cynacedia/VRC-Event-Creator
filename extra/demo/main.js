const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");

let mainWindow = null;
const IS_DEV = !app.isPackaged;

function registerWindowControls() {
  ipcMain.handle("window:minimize", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle("window:maximize", () => {
    if (!mainWindow) {
      return false;
    }
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  });

  ipcMain.handle("window:close", () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.handle("window:isMaximized", () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle("demo:reload", () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });

  ipcMain.on("demo:preload-ready", () => {
    if (IS_DEV) {
      console.log("[demo] preload ready");
    }
  });

  ipcMain.on("demo:preload-error", (_, message) => {
    console.error("[demo] preload error:", message);
  });
}

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 820,
    minWidth: 480,
    minHeight: 520,
    backgroundColor: "#0f1416",
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: IS_DEV
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "..", "electron", "renderer", "index.html"));

  mainWindow.on("maximize", () => {
    if (mainWindow) {
      mainWindow.webContents.send("window:maximized", true);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow) {
      mainWindow.webContents.send("window:maximized", false);
    }
  });

  if (IS_DEV) {
    mainWindow.webContents.on("console-message", (event) => {
      const { level, message, lineNumber, sourceId } = event;
      const levelLabel = typeof level === "number" ? level : "log";
      console.log(`[demo:renderer:${levelLabel}] ${message} (${sourceId}:${lineNumber})`);
    });

    mainWindow.webContents.on("did-fail-load", (_, code, description, validatedURL) => {
      console.error("[demo] failed to load:", code, description, validatedURL);
    });

    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (!input || input.type !== "keyDown") {
        return;
      }
      const key = String(input.key || "").toLowerCase();
      if (input.control && input.shift && (key === "i" || key === "f12")) {
        event.preventDefault();
        mainWindow.webContents.openDevTools({ mode: "detach" });
      }
    });
  }

  mainWindow.webContents.on("render-process-gone", (_, details) => {
    console.error("[demo] renderer process gone:", details);
  });

  mainWindow.on("unresponsive", () => {
    console.error("[demo] window unresponsive");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerWindowControls();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
