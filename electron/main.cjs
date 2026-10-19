const { app, BrowserWindow, protocol, net, session } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");

app.setName("Aurora");
app.setAppUserModelId("com.uiwwsw.aurora");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "aurora",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
// QA data and caches stay on the external build volume. Normal app data uses the OS app directory.
if (process.env.AURORA_QA_DATA) {
  app.setPath("userData", process.env.AURORA_QA_DATA);
  app.setPath("sessionData", path.join(process.env.AURORA_QA_DATA, "session"));
}
function createWindow() {
  const win = new BrowserWindow({
    title: "Aurora",
    width: 1440,
    height: 940,
    minWidth: 800,
    minHeight: 620,
    backgroundColor: "#faf9f6",
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hiddenInset", trafficLightPosition: { x: 20, y: 22 } }
      : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.loadURL("aurora://app/index.html");
}
app.whenReady().then(() => {
  const root = path.resolve(__dirname, "../dist");
  protocol.handle("aurora", (request) => {
    const url = new URL(request.url);
    if (url.host !== "app") return new Response("Forbidden", { status: 403 });
    let target;
    try {
      target = path.resolve(root, "." + decodeURIComponent(url.pathname));
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    if (
      !target.startsWith(root + path.sep) ||
      !fs.existsSync(target) ||
      !fs.statSync(target).isFile()
    ) {
      return new Response("Not found", { status: 404 });
    }
    return net.fetch(pathToFileURL(target).toString());
  });
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
