const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const fs = require("fs");
const path = require("path");

const rendererUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL(rendererUrl);
}

ipcMain.handle("desktop-save-file", async (_event, payload) => {
  const { sourcePath, defaultName } = payload || {};
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return { cancelled: true, error: "Source file not found." };
  }
  const result = await dialog.showSaveDialog({
    defaultPath: defaultName || path.basename(sourcePath),
  });
  if (result.canceled || !result.filePath) {
    return { cancelled: true };
  }
  fs.copyFileSync(sourcePath, result.filePath);
  return { cancelled: false, filePath: result.filePath };
});

ipcMain.handle("desktop-open-external", async (_event, payload) => {
  const { url } = payload || {};
  if (!url) {
    return { ok: false, error: "URL is required." };
  }
  await shell.openExternal(url);
  return { ok: true };
});

ipcMain.handle("desktop-select-file", async (_event, payload) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: payload?.filters || [{ name: "All Files", extensions: ["*"] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { cancelled: true };
  }
  return { cancelled: false, filePath: result.filePaths[0] };
});

app.whenReady().then(() => {
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
