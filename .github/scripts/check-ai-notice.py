#!/usr/bin/env python3
"""Validate the rights-holder notice and voluntary crawler policy without changing licenses."""
import argparse
import hashlib
import subprocess
from pathlib import Path
from urllib.robotparser import RobotFileParser

TRAINING = ("GPTBot", "Google-Extended", "ClaudeBot", "CCBot", "Applebot-Extended")
SEARCH = ("Googlebot", "Yeti", "bingbot", "OAI-SearchBot", "Claude-SearchBot")

def require(ok, message):
    if not ok:
        raise SystemExit("AI notice check failed: " + message)

def robots_check(file, preview=False):
    parser = RobotFileParser()
    parser.parse(file.read_text().splitlines())
    for agent in TRAINING:
        require(not parser.can_fetch(agent, "https://example.test/"), agent + " opt-out missing")
    if not preview:
        for agent in SEARCH:
            require(parser.can_fetch(agent, "https://example.test/"), agent + " search access blocked")

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--web-dir", type=Path)
    ap.add_argument("--package-dir", type=Path)
    args = ap.parse_args()
    root = Path("AI-TRAINING-NOTICE.md")
    notice = root.read_bytes()
    text = notice.decode()
    require("사전 서면 동의" in text and "prior written consent" in text, "bilingual root notice missing")
    require("does not amend existing" in text, "existing-license clause missing")
    require(Path("public/AI-TRAINING-NOTICE.md").read_bytes() == notice, "public notice differs")
    robots_check(Path("public/robots.txt"))
    require("ai-training-notice" in Path("src/main.tsx").read_text(), "native settings notice missing")
    require("  - AI-TRAINING-NOTICE.md" in Path("electron-builder.yml").read_text(), "package notice inclusion missing")
    for name in ("README.md", "README.en.md"):
        require("AI-TRAINING-NOTICE.md" in Path(name).read_text(), name + " notice link missing")
    if args.web_dir:
        for name in ("index.html", "en/index.html"):
            html = (args.web_dir / name).read_text()
            require('href="/legal/ai-training/"' in html and "prior written consent" in html, name + " visible footer notice missing")
        require((args.web_dir / "AI-TRAINING-NOTICE.md").read_bytes() == notice, "built web notice differs")
        require((args.web_dir / "legal/ai-training/index.html").exists(), "legal page missing")
        robots_check(args.web_dir / "robots.txt")
    if args.package_dir:
        archives = list(args.package_dir.rglob("app.asar"))
        require(bool(archives), "no packaged app.asar found")
        digest = hashlib.sha256(notice).hexdigest()
        code = "const a=require('@electron/asar'),c=require('node:crypto');for(const f of ['AI-TRAINING-NOTICE.md','dist/AI-TRAINING-NOTICE.md']){if(c.createHash('sha256').update(a.extractFile(process.argv[1],f)).digest('hex')!==process.argv[2])throw Error('Packaged notice mismatch: '+f);}"
        for archive in archives:
            subprocess.run(["node", "-e", code, str(archive), digest], check=True)
    print("AI notice, license-preserving text and search/training crawler separation verified.")

if __name__ == "__main__":
    main()
