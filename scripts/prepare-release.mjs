import { execFileSync } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version))
  throw new Error("Use a numeric release version.");
const tag = `v${version}`;
const ref = process.env.GITHUB_REF;
const output = (release) =>
  appendFileSync(process.env.GITHUB_OUTPUT, `release=${release}\ntag=${tag}\n`);
if (ref?.startsWith("refs/tags/")) {
  if (ref !== `refs/tags/${tag}`)
    throw new Error("Tag and package version differ.");
  output(true);
} else if (
  ref === "refs/heads/main" &&
  process.env.GITHUB_EVENT_NAME === "push"
) {
  // A version bump on main is the release signal. Ordinary commits only run CI.
  const tags = execFileSync("git", ["tag", "--list", tag], {
    encoding: "utf8",
  }).trim();
  if (tags) {
    const taggedCommit = execFileSync("git", ["rev-list", "-n", "1", tag], {
      encoding: "utf8",
    }).trim();
    let published = false;
    try {
      published = !JSON.parse(
        execFileSync("gh", ["release", "view", tag, "--json", "isDraft"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }),
      ).isDraft;
    } catch {
      /* No release yet: the same commit may retry failed packaging. */
    }
    output(taggedCommit === process.env.GITHUB_SHA && !published);
  } else {
    execFileSync("git", ["tag", tag], { stdio: "inherit" });
    execFileSync("git", ["push", "origin", `refs/tags/${tag}`], {
      stdio: "inherit",
    });
    output(true);
  }
} else output(false);
