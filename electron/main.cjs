const {
  app,
  BrowserWindow,
  protocol,
  net,
  session,
  ipcMain,
} = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const fs = require("node:fs");
const providers = require("./providers.cjs");
app.setName("Aurora");
app.setAppUserModelId("com.uiwwsw.aurora");
const envFile = app.isPackaged
  ? path.join(app.getPath("userData"), ".env")
  : path.join(__dirname, "../.env");
if (!process.env.AURORA_DISABLE_ENV_FILE && fs.existsSync(envFile))
  process.loadEnvFile(envFile);

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
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.loadURL("aurora://app/index.html");
}
const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();
else
  app.whenReady().then(() => {
    app.on("second-instance", () => {
      const current = BrowserWindow.getAllWindows()[0];
      if (current) {
        if (current.isMinimized()) current.restore();
        current.show();
        current.focus();
      } else createWindow();
    });
    const authorized = (event) =>
      event.senderFrame?.url === "aurora://app/index.html" &&
      BrowserWindow.fromWebContents(event.sender);
    const inFlight = new Set();
    ipcMain.handle("aurora:ai-status", (event) => {
      if (!authorized(event)) throw new Error("Forbidden");
      return providers.status();
    });
    ipcMain.handle("aurora:ai-request", async (event, payload) => {
      if (!authorized(event)) throw new Error("Forbidden");
      const id = event.sender.id;
      if (inFlight.has(id)) throw new Error("이미 요청을 처리 중입니다.");
      inFlight.add(id);
      try {
        return await providers.request(payload);
      } finally {
        inFlight.delete(id);
      }
    });
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
