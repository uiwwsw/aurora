import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { writeFileSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const env = { ...process.env };
const mac =
  process.argv.includes("--mac") ||
  (process.platform === "darwin" && !process.argv.includes("--win"));
env.CSC_LINK = (mac ? env.MAC_CSC_LINK : env.WIN_CSC_LINK) || env.CSC_LINK;
env.CSC_KEY_PASSWORD =
  (mac ? env.MAC_CSC_KEY_PASSWORD : env.WIN_CSC_KEY_PASSWORD) ||
  env.CSC_KEY_PASSWORD;
const signedMac = mac && !!env.CSC_LINK;
const overrides = [];
if (signedMac) {
  // Import Developer ID and require signing instead of the development identity.
  overrides.push("-c.forceCodeSigning=true");
  if (!env.APPLE_ID || !env.APPLE_APP_SPECIFIC_PASSWORD || !env.APPLE_TEAM_ID)
    throw new Error(
      "Signed macOS releases require Apple notarization credentials.",
    );
  overrides.push("-c.mac.notarize=true");
}
if (mac && !signedMac) overrides.push("-c.mac.identity=-");
if (!mac && env.CSC_LINK) overrides.push("-c.forceCodeSigning=true");
overrides.push(`-c.extraMetadata.auroraAutoUpdate.macSigned=${signedMac}`);
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
    ...overrides,
    "--publish",
    "never",
  ],
  { env, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status === 0) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const arch = process.argv.includes("--arm64")
    ? "arm64"
    : process.argv.includes("--x64")
      ? "x64"
      : process.arch;
  writeFileSync(
    `distribution/${pkg.version}/build-info-${mac ? "mac" : "win"}-${arch}.json`,
    JSON.stringify({
      version: pkg.version,
      platform: mac ? "mac" : "win",
      arch,
      developerSigned: mac ? signedMac : !!env.CSC_LINK,
      notarized: signedMac,
    }),
  );
}
process.exit(result.status ?? 1);
