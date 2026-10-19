import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const env = { ...process.env };
if (env.DEV_BUILD_ROOT) {
  env.ELECTRON_CACHE = path.join(env.DEV_BUILD_ROOT, "electron-cache");
  env.ELECTRON_BUILDER_CACHE = path.join(
    env.DEV_BUILD_ROOT,
    "electron-builder-cache",
  );
}
const result = spawnSync(
  process.execPath,
  [
    require.resolve("electron-builder/cli.js"),
    ...process.argv.slice(2),
    "--publish",
    "never",
  ],
  { env, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
