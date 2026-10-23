import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createRequire } from "node:module";
const { setupUpdates } = createRequire(import.meta.url)(
  "../electron/updates.cjs",
);
function fixture(options = {}) {
  let checks = 0,
    installs = 0,
    intervals = 0;
  const messages: any[] = [];
  const updater = Object.assign(new EventEmitter(), {
    checkForUpdates: async () => {
      checks++;
    },
    quitAndInstall: () => {
      installs++;
    },
  });
  const app = Object.assign(new EventEmitter(), {
    isPackaged: true,
    getVersion: () => "0.1.2",
  });
  const controller = setupUpdates({
    app,
    autoUpdater: updater,
    platform: "win32",
    dialog: {
      showMessageBox: async (o: any) => {
        messages.push(o);
        return { response: 0 };
      },
    },
    Menu: { buildFromTemplate: (v: any) => v, setApplicationMenu: () => {} },
    setIntervalImpl: (_: any, delay: number) => {
      intervals++;
      assert.equal(delay, 21600000);
      return { unref() {} };
    },
    ...options,
  });
  return {
    controller,
    updater,
    messages,
    counts: () => ({ checks, installs, intervals }),
  };
}
test("packaged app checks once on startup, prevents overlapping checks, and never downgrades", async () => {
  const f = fixture();
  await f.controller.check();
  assert.equal(f.counts().checks, 1);
  assert.equal((f.updater as any).autoDownload, true);
  assert.equal((f.updater as any).autoInstallOnAppQuit, true);
  assert.equal((f.updater as any).allowDowngrade, false);
  f.updater.emit("update-not-available");
  await f.controller.check(true);
  f.updater.emit("update-not-available");
  assert.match(f.messages.at(-1).message, /최신/);
});

test("Store packages delegate updates to Microsoft Store without contacting GitHub", async () => {
  const f = fixture({ storeDistribution: true });
  await f.controller.check(true);
  assert.equal(f.counts().checks, 0);
  assert.equal(f.counts().intervals, 0);
  assert.equal(f.counts().installs, 0);
  assert.match(f.messages[0].message, /Microsoft Store/);
});
test("downloaded update offers restart and defers when user is working", async () => {
  const f = fixture();
  f.updater.emit("update-downloaded");
  await Promise.resolve();
  assert.equal(f.counts().installs, 0);
  assert.match(f.messages[0].detail, /저장하지 않은/);
  await f.controller.check();
  assert.equal(f.counts().checks, 1);
});
test("restart acceptance invokes installer only after download", async () => {
  const f = fixture({
    dialog: { showMessageBox: async () => ({ response: 1 }) },
  });
  f.updater.emit("update-downloaded");
  await Promise.resolve();
  assert.equal(f.counts().installs, 1);
});
test("background errors stay quiet; manual errors explain retry and release the lock", async () => {
  const f = fixture();
  f.updater.emit("error", new Error("provider details"));
  assert.equal(f.messages.length, 0);
  await f.controller.check(true);
  f.updater.emit("error", new Error("provider details"));
  assert.match(f.messages[0].message, /못했습니다/);
  assert.equal(JSON.stringify(f.messages).includes("provider details"), false);
  await f.controller.check();
  assert.equal(f.counts().checks, 3);
});
test("development, QA, and unsigned macOS builds never contact update server", async () => {
  for (const options of [
    {
      app: Object.assign(new EventEmitter(), {
        isPackaged: false,
        getVersion: () => "0.1.2",
      }),
    },
    { disabled: true },
    { platform: "darwin" },
  ]) {
    const f = fixture(options);
    await f.controller.check(true);
    assert.equal(f.counts().checks, 0);
    assert.equal(f.counts().intervals, 0);
    assert.match(f.messages[0].message, /사용할 수 없습니다/);
  }
  assert.equal(
    fixture({ platform: "darwin", macSigned: true }).counts().checks,
    1,
  );
});
