import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const yaml = createRequire(import.meta.url)("js-yaml");
const script = fileURLToPath(
  new URL("../scripts/publish-release.mjs", import.meta.url),
);
function fixture(fn: (root: string, files: string[]) => void) {
  const root = mkdtempSync(path.join(tmpdir(), "aurora-release-"));
  const assets = path.join(root, "release-assets");
  const files: string[] = [];
  mkdirSync(assets);
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ version: "0.1.2" }),
  );
  for (const [platform, arch] of [
    ["mac", "arm64"],
    ["mac", "x64"],
    ["win", "x64"],
  ]) {
    const dir = path.join(assets, `${platform}-${arch}`);
    mkdirSync(dir);
    const entries = [];
    for (const ext of platform === "mac" ? ["dmg", "zip"] : ["exe"]) {
      const name = `Aurora-0.1.2-${platform === "mac" ? "mac" : "windows"}-${arch}.${ext}`;
      const bytes = Buffer.alloc(1000001, arch === "arm64" ? 1 : 2);
      writeFileSync(path.join(dir, name), bytes);
      files.push(path.join(dir, name));
      entries.push({
        url: name,
        sha512: createHash("sha512").update(bytes).digest("base64"),
        size: bytes.length,
      });
      writeFileSync(path.join(dir, name + ".blockmap"), "fixture blockmap");
    }
    writeFileSync(
      path.join(dir, platform === "mac" ? "latest-mac.yml" : "latest.yml"),
      yaml.dump({
        version: "0.1.2",
        files: entries,
        path: entries[0].url,
        sha512: entries[0].sha512,
      }),
    );
    writeFileSync(
      path.join(dir, `build-info-${platform}-${arch}.json`),
      JSON.stringify({
        version: "0.1.2",
        platform,
        arch,
        developerSigned: platform === "mac",
        notarized: platform === "mac",
      }),
    );
  }
  try {
    fn(root, files);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
function verify(cwd: string) {
  return execFileSync(process.execPath, [script, "--verify-only"], {
    cwd,
    env: {
      ...process.env,
      GITHUB_REF: "refs/tags/v0.1.2",
      GITHUB_REPOSITORY: "uiwwsw/aurora",
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
test("release merges macOS architectures and verifies update checksums before publishing", () =>
  fixture((root) => {
    assert.match(verify(root), /Verified 5 installers/);
    const merged = yaml.load(
      readFileSync(path.join(root, "release-assets/latest-mac.yml"), "utf8"),
    );
    assert.equal(merged.files.length, 4);
    assert.ok(merged.files.some((f: any) => f.url.endsWith("arm64.zip")));
    assert.ok(merged.files.some((f: any) => f.url.endsWith("x64.zip")));
    const manifest = JSON.parse(
      readFileSync(
        path.join(root, "release-assets/release-manifest.json"),
        "utf8",
      ),
    );
    assert.equal(manifest.signing["mac-arm64"].developerSigned, true);
    assert.ok(manifest.assets.some((a: any) => a.name === "latest.yml"));
  }));
test("unsigned macOS output cannot be published", () =>
  fixture((root) => {
    const file = path.join(
      root,
      "release-assets/mac-arm64/build-info-mac-arm64.json",
    );
    const report = JSON.parse(readFileSync(file, "utf8"));
    report.notarized = false;
    writeFileSync(file, JSON.stringify(report));
    assert.throws(() => verify(root), /signed and notarized/);
  }));
test("tampered installer aborts release before any GitHub write", () =>
  fixture((root, files) => {
    writeFileSync(files[0], Buffer.alloc(1000001, 9));
    assert.throws(() => verify(root), /checksum mismatch/);
  }));
test("missing platform metadata aborts release", () =>
  fixture((root) => {
    rmSync(path.join(root, "release-assets/mac-x64/latest-mac.yml"));
    assert.throws(() => verify(root), /Missing platform update feeds/);
  }));
