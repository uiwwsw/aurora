import test from "node:test";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { buildWeb, origin } from "../scripts/build-web.mjs";
async function fixture(
  run: (root: string, inputDir: string, outputDir: string) => Promise<void>,
) {
  const root = await mkdtemp(path.join(tmpdir(), "aurora-seo-"));
  const inputDir = path.join(root, "dist");
  const outputDir = path.join(root, "web");
  await mkdir(path.join(inputDir, "assets"), { recursive: true });
  await writeFile(
    path.join(inputDir, "index.html"),
    '<!doctype html><html><head><script type="module" src="./assets/app.js"></script><link rel="stylesheet" href="./assets/app.css"></head><body><div id="root"></div></body></html>',
  );
  await writeFile(path.join(inputDir, "assets/app.js"), "// fixture");
  try {
    await run(root, inputDir, outputDir);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
test("web pages expose localized content, self canonicals, reciprocal alternates and visible schema", async () =>
  fixture(async (_, inputDir, outputDir) => {
    await buildWeb({ inputDir, outputDir, production: true });
    const ko = await readFile(path.join(outputDir, "index.html"), "utf8");
    const en = await readFile(path.join(outputDir, "en/index.html"), "utf8");
    for (const [lang, html, url] of [
      ["ko", ko, origin + "/"],
      ["en", en, origin + "/en/"],
    ]) {
      assert.ok(html.includes(`<html lang="${lang}">`));
      assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
      assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
      assert.ok(html.includes('hreflang="ko"'));
      assert.ok(html.includes('hreflang="en"'));
      assert.ok(html.includes('hreflang="x-default"'));
      assert.ok(
        html.includes('content="index,follow,max-image-preview:large"'),
      );
      assert.ok(html.includes('id="overview"'));
      const json = html.match(
        /<script type="application\/ld\+json">(.*?)<\/script>/s,
      )![1];
      const schema = JSON.parse(json);
      assert.equal(schema["@type"], "WebPage");
      assert.equal(schema.url, url);
      assert.equal(schema.aggregateRating, undefined);
      assert.ok(
        html.includes(
          `'sha256-${createHash("sha256").update(json).digest("base64")}'`,
        ),
      );
    }
    assert.ok(ko.includes('src="/assets/app.js"'));
    assert.ok(ko.includes('href="/assets/app.css"'));
    assert.ok(en.includes("The public 0.1.2 preview"));
    assert.ok(!en.includes('src="/assets/app.js"'));
    assert.ok(
      (await readFile(path.join(inputDir, "index.html"), "utf8")).includes(
        'src="./assets/app.js"',
      ),
    );
    const sitemap = await readFile(path.join(outputDir, "sitemap.xml"), "utf8");
    assert.equal((sitemap.match(/<loc>/g) || []).length, 2);
    assert.ok(
      (await readFile(path.join(outputDir, "robots.txt"), "utf8")).includes(
        `Sitemap: ${origin}/sitemap.xml`,
      ),
    );
    assert.ok(
      (await readFile(path.join(outputDir, "404.html"), "utf8")).includes(
        'content="noindex"',
      ),
    );
  }));
test("preview deployments do not invite search indexing", async () =>
  fixture(async (_, inputDir, outputDir) => {
    await buildWeb({ inputDir, outputDir, production: false });
    for (const file of ["index.html", "en/index.html"]) {
      assert.ok(
        (await readFile(path.join(outputDir, file), "utf8")).includes(
          'content="noindex,nofollow"',
        ),
      );
    }
    assert.equal(
      await readFile(path.join(outputDir, "robots.txt"), "utf8"),
      "User-agent: *\nDisallow: /\n",
    );
  }));

test("Vercel upload retains build dependencies while excluding desktop and private inputs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "aurora-upload-policy-"));
  try {
    await writeFile(
      path.join(root, ".gitignore"),
      await readFile(new URL("../.vercelignore", import.meta.url)),
    );
    const init = spawnSync("git", [
      "-c",
      "init.templateDir=",
      "init",
      "--quiet",
      root,
    ]);
    assert.equal(init.status, 0);
    for (const file of [
      ".github/scripts/apply-ai-notice.mjs",
      ".github/ai-notice.json",
      "scripts/build-web.mjs",
      "public/landing.css",
      "AI-TRAINING-NOTICE.md",
    ]) {
      const result = spawnSync(
        "git",
        [
          "-c",
          "core.excludesfile=/dev/null",
          "check-ignore",
          "--no-index",
          "--quiet",
          file,
        ],
        { cwd: root },
      );
      assert.equal(result.status, 1, `${file} must be uploaded`);
    }
    for (const file of [
      ".github/workflows/release.yml",
      ".github/scripts/check-public-docs.py",
      ".env.local",
      "electron/main.cjs",
      "distribution/Aurora.app",
      "scripts/package.mjs",
    ]) {
      const result = spawnSync(
        "git",
        [
          "-c",
          "core.excludesfile=/dev/null",
          "check-ignore",
          "--no-index",
          "--quiet",
          file,
        ],
        { cwd: root },
      );
      assert.equal(result.status, 0, `${file} must remain excluded`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
