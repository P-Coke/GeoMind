const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("geeAiDesktop", {
  platform: process.platform,
  saveFile: (sourcePath, defaultName) => ipcRenderer.invoke("desktop-save-file", { sourcePath, defaultName }),
  openExternal: (url) => ipcRenderer.invoke("desktop-open-external", { url }),
  selectFile: (filters) => ipcRenderer.invoke("desktop-select-file", { filters }),
});
