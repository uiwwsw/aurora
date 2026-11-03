import { createRequire } from "node:module";
const asar = createRequire(import.meta.url)("@electron/asar");
const archive = process.argv[2];
if (!archive) throw new Error("Provide the packaged app.asar path.");
const names = asar.listPackage(archive).map((name) => name.replaceAll("\\", "/"));
if (names.some((name) => /(^|\/)\.(?:env(?:\.|$)|private(?:\/|$)|secrets(?:\/|$)|local-notes(?:\/|$))/.test(name)))
  throw new Error("Package contains a forbidden private path; contents withheld.");
const pkg = JSON.parse(asar.extractFile(archive, "package.json").toString());
console.log(JSON.stringify({ version: pkg.version, forbiddenPrivatePaths: 0 }));
