import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
if (process.platform !== "win32")
  throw new Error("Build Store packages on Windows.");
const fields = {
  identityName: process.env.STORE_IDENTITY_NAME,
  publisher: process.env.STORE_PUBLISHER,
  publisherDisplayName: process.env.STORE_PUBLISHER_DISPLAY_NAME,
};
if (!/^[A-Za-z0-9][A-Za-z0-9.-]{2,49}$/.test(fields.identityName ?? ""))
  throw new Error("Use the package identity name assigned by Partner Center.");
if (
  !/^CN=[^\r\n]+$/.test(fields.publisher ?? "") ||
  !fields.publisherDisplayName?.trim()
)
  throw new Error("Use the exact publisher values assigned by Partner Center.");
const config = {
  extends: path.resolve("electron-builder.yml"),
  directories: { output: "distribution/store" },
  win: {
    target: [{ target: "appx", arch: ["x64"] }],
    signAndEditExecutable: false,
  },
  appx: {
    ...fields,
    applicationId: "Aurora",
    artifactName: "Aurora-${version}-store-${arch}.appx",
  },
  extraMetadata: { auroraDistribution: "store" },
};
const configPath = "distribution/store-builder.json";
mkdirSync("distribution", { recursive: true });
writeFileSync(configPath, JSON.stringify(config, null, 2));
const env = { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" };
for (const name of [
  "CSC_LINK",
  "CSC_KEY_PASSWORD",
  "WIN_CSC_LINK",
  "WIN_CSC_KEY_PASSWORD",
])
  delete env[name];
const result = spawnSync(
  process.execPath,
  [
    require.resolve("electron-builder/cli.js"),
    "--win",
    "--x64",
    "--config",
    configPath,
    "--publish",
    "never",
  ],
  { env, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(
  "Unsigned Store submission package built. It is not a signed public installer; submit it to Microsoft Store for certification and signing.",
);
