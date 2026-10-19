import { readFile, readdir, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const tag = `v${pkg.version}`;
if (process.env.GITHUB_REF !== `refs/tags/${tag}`)
  throw new Error("Release tag must match package.json version.");
const repo = process.env.GITHUB_REPOSITORY;
if (repo !== "uiwwsw/aurora")
  throw new Error("Publishing is configured for uiwwsw/aurora only.");
const directory = "release-assets";
const expected = [
  `Aurora-${pkg.version}-mac-arm64.dmg`,
  `Aurora-${pkg.version}-mac-arm64.zip`,
  `Aurora-${pkg.version}-mac-x64.dmg`,
  `Aurora-${pkg.version}-mac-x64.zip`,
  `Aurora-${pkg.version}-windows-x64.exe`,
];
const names = await readdir(directory, { recursive: true });
const manifest = {
  version: pkg.version,
  tag,
  preview: true,
  developerSigned: false,
  notarized: false,
  assets: [],
};
for (const name of expected) {
  const candidates = names.filter(
    (candidate) => path.basename(candidate) === name,
  );
  if (candidates.length !== 1)
    throw new Error(`Missing or duplicate installer: ${name}`);
  if (candidates[0] !== name)
    await copyFile(
      path.join(directory, candidates[0]),
      path.join(directory, name),
    );
  const bytes = await readFile(path.join(directory, name));
  if (bytes.length < 1000000)
    throw new Error(`Installer unexpectedly small: ${name}`);
  manifest.assets.push({
    name,
    size: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    url: `https://github.com/${repo}/releases/download/${tag}/${name}`,
  });
}
const checksums =
  manifest.assets.map((a) => `${a.sha256}  ${a.name}`).join("\n") + "\n";
await writeFile(path.join(directory, "SHA256SUMS.txt"), checksums);
await writeFile(
  path.join(directory, "release-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
const notes = `Aurora ${pkg.version} 개발 프리뷰입니다. Node.js 설치 없이 사용할 수 있는 macOS·Windows 설치 파일을 제공합니다.\n\n| 운영체제 | 다운로드 |\n| --- | --- |\n| macOS · Apple Silicon | [DMG](${manifest.assets[0].url}) |\n| macOS · Intel | [DMG](${manifest.assets[2].url}) |\n| Windows · x64 | [EXE 설치 파일](${manifest.assets[4].url}) |\n\nmacOS는 DMG를 열어 Aurora를 Applications 폴더로 옮깁니다. Windows는 EXE 설치 프로그램을 실행합니다.\n\n**서명 상태:** macOS는 ad-hoc 서명이며 Apple Developer ID 서명·공증은 없습니다. Windows 설치 파일도 개발자 인증서로 서명되지 않았습니다. 운영체제의 보안 확인 또는 실행 제한이 나타날 수 있습니다.\n\n기본은 오프라인 미리보기입니다. 실제 API 사용은 별도 키 설정이 필요하며, 라이브 모델 호출은 아직 검증하지 않았습니다. 텍스트 답변만 지원하고 파일 수정·셸 실행은 하지 않습니다. 계정 잔여량·전체 작업 예산 제한·앱 자동 업데이트는 아직 없습니다.\n\n체크섬은 SHA256SUMS.txt, 파일 목록과 서명 상태는 release-manifest.json을 참고하세요.\n\n[README](https://github.com/${repo}#readme) · [변경 기록](https://github.com/${repo}/blob/${tag}/CHANGELOG.md)\n`;
await writeFile(path.join(directory, "release-notes.md"), notes);
const gh = (args) =>
  execFileSync("gh", args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  }).trim();
let existing = null;
try {
  existing = JSON.parse(
    gh(["release", "view", tag, "--repo", repo, "--json", "isDraft"]),
  );
} catch {}
if (existing && !existing.isDraft)
  throw new Error(
    "Release is already public; never overwrite published installers.",
  );
if (!existing)
  gh([
    "release",
    "create",
    tag,
    "--repo",
    repo,
    "--verify-tag",
    "--draft",
    "--prerelease",
    "--title",
    `Aurora ${tag} — Desktop preview`,
    "--notes-file",
    path.join(directory, "release-notes.md"),
  ]);
else
  gh([
    "release",
    "edit",
    tag,
    "--repo",
    repo,
    "--notes-file",
    path.join(directory, "release-notes.md"),
  ]);
gh([
  "release",
  "upload",
  tag,
  "--repo",
  repo,
  ...expected.map((n) => path.join(directory, n)),
  path.join(directory, "SHA256SUMS.txt"),
  path.join(directory, "release-manifest.json"),
  "--clobber",
]);
gh(["release", "edit", tag, "--repo", repo, "--draft=false"]);
console.log(
  `Published ${expected.length} installers: https://github.com/${repo}/releases/tag/${tag}`,
);
