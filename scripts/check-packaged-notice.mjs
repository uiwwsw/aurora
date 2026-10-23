import { createRequire } from "node:module";
const asar = createRequire(import.meta.url)("@electron/asar");
const archive = process.argv[2];
if (!archive) throw new Error("Provide the packaged app.asar path.");
const names = asar.listPackage(archive).map((name) => name.replaceAll("\\", "/"));
if (names.some((name) => /(^|\/)\.(?:env(?:\.|$)|private(?:\/|$)|secrets(?:\/|$)|local-notes(?:\/|$))/.test(name)))
  throw new Error("Package contains a forbidden private path; contents withheld.");
if (!names.includes("/AI-TRAINING-NOTICE.md"))
  throw new Error("Package is missing the AI training notice.");
const notice = asar.extractFile(archive, "AI-TRAINING-NOTICE.md").toString();
if (!notice.includes("AI") || !/[가-힣]/.test(notice))
  throw new Error("The packaged notice must include both languages.");
const pkg = JSON.parse(asar.extractFile(archive, "package.json").toString());
console.log(JSON.stringify({ version: pkg.version, bilingualNoticeIncluded: true, forbiddenPrivatePaths: 0 }));
