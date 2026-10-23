// Keep updates in the main process. The renderer cannot choose a feed or installer.
function setupUpdates({
  app,
  autoUpdater,
  dialog,
  Menu,
  platform = process.platform,
  macSigned = false,
  disabled = false,
  storeDistribution = process.windowsStore === true,
  setIntervalImpl = setInterval,
}) {
  let checking = false;
  let manual = false;
  let downloaded = false;
  const unavailable =
    !app.isPackaged ||
    disabled ||
    storeDistribution ||
    !["darwin", "win32"].includes(platform) ||
    (platform === "darwin" && !macSigned);
  const tell = (message, detail = "") =>
    dialog.showMessageBox({
      type: "info",
      title: "Aurora 업데이트",
      message,
      detail,
    });
  const failed = () => {
    checking = false;
    if (manual)
      void tell(
        "업데이트를 확인하거나 다운로드하지 못했습니다.",
        "인터넷 연결을 확인하고 나중에 다시 시도해 주세요. 현재 버전은 계속 사용할 수 있습니다.",
      );
    manual = false;
  };
  const restart = async () => {
    const { response } = await dialog.showMessageBox({
      type: "info",
      title: "Aurora 업데이트",
      message: "새 버전이 준비되었습니다.",
      detail:
        "재시작하면 업데이트가 적용됩니다. 저장하지 않은 대화는 사라질 수 있습니다. 나중에를 선택하면 정상 종료 시 설치합니다.",
      buttons: ["나중에", "지금 재시작"],
      defaultId: 0,
      cancelId: 0,
    });
    if (response === 1) autoUpdater.quitAndInstall(false, true);
  };
  const check = async (requested = false) => {
    if (unavailable) {
      if (requested)
        await tell(
          storeDistribution
            ? "Microsoft Store에서 업데이트를 확인해 주세요."
            : "이 빌드에서는 자동 업데이트를 사용할 수 없습니다.",
          storeDistribution
            ? "Store 설치 앱의 업데이트는 Microsoft Store가 관리합니다."
            : platform === "darwin" && !macSigned
              ? "Developer ID로 서명된 버전이 필요합니다. 기존 개발 프리뷰는 새 설치 파일로 교체해 주세요."
              : "설치된 배포 앱에서 사용할 수 있습니다.",
        );
      return;
    }
    if (downloaded) {
      if (requested) await restart();
      return;
    }
    if (checking) {
      if (requested) await tell("업데이트를 확인하거나 다운로드하고 있습니다.");
      return;
    }
    checking = true;
    manual = requested;
    try {
      await autoUpdater.checkForUpdates();
    } catch {
      failed();
    }
  };
  if (!unavailable) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = true; // Aurora is currently distributed as a developer preview.
    autoUpdater.allowDowngrade = false;
    autoUpdater.on("update-not-available", () => {
      checking = false;
      if (manual) void tell("최신 버전을 사용하고 있습니다.");
      manual = false;
    });
    autoUpdater.on("error", failed);
    autoUpdater.on("update-downloaded", () => {
      checking = false;
      manual = false;
      downloaded = true;
      void restart();
    });
  }
  const menu = [];
  if (platform === "darwin") menu.push({ role: "appMenu" });
  menu.push(
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      label: "도움말",
      submenu: [
        {
          label: "업데이트 확인…",
          click: () => {
            void check(true);
          },
        },
        { label: `Aurora ${app.getVersion()}`, enabled: false },
      ],
    },
  );
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  let timer;
  if (!unavailable) {
    void check();
    timer = setIntervalImpl(
      () => {
        void check();
      },
      6 * 60 * 60 * 1000,
    );
    timer.unref?.();
    app.once("before-quit", () => clearInterval(timer));
  }
  return { check };
}
module.exports = { setupUpdates };
