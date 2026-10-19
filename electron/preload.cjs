const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("auroraAI", {
  status: () => ipcRenderer.invoke("aurora:ai-status"),
  request: (payload) => ipcRenderer.invoke("aurora:ai-request", payload),
});
