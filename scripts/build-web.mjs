import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
export const origin = "https://aurora-two-virid.vercel.app";
const release = "https://github.com/uiwwsw/aurora/releases/tag/v0.1.2";
const repo = "https://github.com/uiwwsw/aurora";
const verification =
  '<meta name="google-site-verification" content="b7vKjUgQjabMbz1oYHEAqD3DvJJexV7WSpJPxTTTs_c"><meta name="naver-site-verification" content="5ffb0ec5bd027c7691da31041883a09b2fb98892">';
const translations = {
  ko: {
    title: "오로라 Aurora — AI 모델 선택과 예상 토큰 검토 데모",
    description:
      "오로라(Aurora)는 작업별 AI 모델과 예상 토큰을 검토하는 macOS·Windows 데스크톱 AI 작업 공간입니다. 웹 데모에서 대화 정리, 모델 비교와 토큰 예산 미리보기를 체험하세요.",
    heading: "대화는 하나로, 모델과 토큰은 실행 전에 검토하세요.",
    intro:
      "오로라(Aurora, Auto Router · Low AI)는 요청 범위와 실행 모델, 예상 입력·출력 토큰을 먼저 확인하는 데스크톱 AI 작업 공간입니다. 이 페이지의 웹 데모는 외부 AI 호출 없이 로컬 미리보기로 동작합니다.",
    demo: "데모로 돌아가기",
    overview: "제품 소개",
    download: "데스크톱 다운로드",
    language: "English",
    other: "/en/",
    features: [
      [
        "하나의 대화와 작업 정리",
        "대화를 여러 세션으로 나누지 않고 이어갑니다. 작업을 묶거나 보관·휴지통으로 이동하고 복원할 수 있으며, 직접 세션을 관리하는 레거시 모드도 제공합니다.",
      ],
      [
        "실행 전 모델 비교",
        "내부 분석 모델과 실행 모델을 따로 설정하고 요청마다 실행 모델을 고릅니다. 공개 개발 프리뷰의 분석 호출과 모델 선택은 수동이며, 자동 라우팅의 품질을 보장하지 않습니다.",
      ],
      [
        "예상 토큰과 실제 사용량 구분",
        "문자 수와 모델 등급별 출력 가정으로 입력·출력 토큰 범위를 표시합니다. 직접 정한 계획 예산과 비교하며, 계정 잔여 한도나 확정 비용을 뜻하지 않습니다.",
      ],
      [
        "macOS·Windows 설치 앱",
        "Apple Silicon·Intel Mac과 Windows x64 설치 파일을 제공합니다. Windows는 새 버전을 자동 다운로드하며, macOS 자동 업데이트는 정식 Developer ID 서명 빌드가 필요합니다.",
      ],
    ],
    questions: [
      [
        "웹 데모에서 실제 AI를 호출하나요?",
        "아니요. 웹은 대화 정리와 모델·토큰 범위 검토를 체험하는 로컬 미리보기입니다. 제공자 API 연결은 설치 앱에서 설정합니다.",
      ],
      [
        "모델을 자동으로 바꿔 실행하나요?",
        "공개 0.1.2 프리뷰는 분석 버튼과 실행 모델 선택을 사용자가 직접 조작합니다. 추천과 실제 실행을 구분해 확인할 수 있습니다.",
      ],
      [
        "예상 토큰은 정확한 비용인가요?",
        "아니요. 등급별 출력 가정이며 실측 기반의 모델별 예측이나 비용 보장이 아닙니다. 제공자가 반환하는 실제 사용량은 별도로 표시합니다.",
      ],
      [
        "데이터는 어디에 저장되나요?",
        "대화 저장은 기본 꺼짐입니다. 저장을 켜면 현재 기기에 기록하며 암호화 보관함은 아닙니다. 웹 미리보기는 AI 제공자에게 대화를 전송하지 않습니다.",
      ],
      [
        "설치 앱 업데이트와 보안 경고는 어떻게 되나요?",
        "0.1.2부터 Windows 업데이트를 지원하며 기존 0.1.1 이하 버전은 새 설치 파일로 교체해야 합니다. 현재 macOS 개발 프리뷰는 ad-hoc 서명이라 자동 업데이트가 꺼져 있고, 운영체제의 보안 확인이 나타날 수 있습니다.",
      ],
    ],
    featureTitle: "오로라에서 할 수 있는 일",
    faq: "자주 묻는 질문",
    limitations: "개발 프리뷰의 범위",
    limitation:
      "현재 텍스트 답변만 지원하며 파일 수정·셸 실행은 제공하지 않습니다. 전체 작업의 토큰·비용 강제 한도와 실제 버전 간 업데이트는 미검증입니다. 기능 완성이나 검색 노출을 보장하지 않습니다.",
    browser: "브라우저 데모 · 외부 AI 호출 없음",
    open: "웹 데모 열기",
    source: "소스와 문서",
    guide: "영어 README",
    links: "설치 파일 · 변경 기록 · MIT 라이선스",
    nojs: "JavaScript를 켜면 상단에서 대화형 데모를 사용할 수 있습니다. 아래 제품 소개와 다운로드 링크는 JavaScript 없이도 읽을 수 있습니다.",
  },
  en: {
    title: "Aurora — AI Model Selection and Token Estimate Demo",
    description:
      "Review AI model choices and estimated tokens with Aurora for macOS and Windows. Try the local web demo for conversation organization and planning budgets.",
    heading:
      "One conversation. Review the model and token range before running.",
    intro:
      "Aurora (Auto Router · Low AI) is a desktop AI workspace for reviewing request scope, execution models, and estimated input and output tokens. The browser demo is a local preview without external AI calls; the interactive interface is currently in Korean.",
    demo: "Open demo",
    overview: "Overview",
    download: "Download desktop app",
    language: "한국어",
    other: "/",
    features: [
      [
        "One conversation with organized work",
        "Keep work in a continuous conversation, group related messages, archive or move work to trash, and restore it later. A legacy mode also supports manually managed sessions.",
      ],
      [
        "Compare models before execution",
        "Configure separate analyzer and executor roles and choose the model for each request. In the public developer preview, analysis and model selection are manual; automated routing quality is not guaranteed.",
      ],
      [
        "Separate estimates from observed usage",
        "Review input and output token ranges based on character counts and tier-level output assumptions. Compare with a planning budget you set; these figures are not account quotas or guaranteed costs.",
      ],
      [
        "macOS and Windows installers",
        "Download installers for Apple Silicon and Intel Macs and Windows x64. Windows can download new versions automatically. macOS updating requires a Developer ID-signed build.",
      ],
    ],
    questions: [
      [
        "Does the browser demo call an AI provider?",
        "No. It previews conversation organization, model comparison and estimated token ranges locally. Provider API connections are configured in the installed desktop app.",
      ],
      [
        "Does Aurora automatically switch execution models?",
        "The public 0.1.2 preview requires an explicit analysis action and manual execution-model selection. A recommendation is separate from an execution request.",
      ],
      [
        "Are token estimates exact costs?",
        "No. They use tier-level output assumptions, not per-model empirical predictions or cost guarantees. Actual usage returned by a provider is displayed separately.",
      ],
      [
        "Where is conversation data stored?",
        "Conversation persistence is off by default. Enabling it stores data on the current device; it is not an encrypted vault. The web preview does not send conversations to AI providers.",
      ],
      [
        "How do updates and installation warnings work?",
        "Windows updating is included from 0.1.2. Versions 0.1.1 and earlier need a manual replacement. The current ad-hoc macOS preview has automatic updates disabled, and operating-system security prompts may appear.",
      ],
    ],
    featureTitle: "What you can explore",
    faq: "Frequently asked questions",
    limitations: "Developer preview limitations",
    limitation:
      "Only text responses are supported; filesystem editing and shell execution are unavailable. Whole-task token and cost enforcement and real cross-version updating remain unverified. Task completion and search inclusion are not guaranteed.",
    browser: "Local browser demo · No external AI calls",
    open: "Open demo · Korean interface",
    source: "Source and documentation",
    guide: "English README",
    links: "Installers · Changelog · MIT license",
    nojs: "Enable JavaScript to use the interactive demo. Product information and downloads remain accessible without it.",
  },
};
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
function landingHero(lang) {
  const en = lang === "en";
  return `<section class="landing-hero" aria-label="${en ? "Meet Aurora" : "오로라 소개"}"><div class="hero-orbit" aria-hidden="true"><i></i><i></i><i></i></div><div class="hero-copy"><p class="hero-kicker"><span></span> AURORA · DEVELOPER PREVIEW</p><p class="hero-title">${en ? "A little less friction.<br>A lot more possibility." : "생각은 자유롭게.<br>가능성은 더 넓게."}</p><p class="hero-description">${en ? "One conversation. The right model for each task.<br>Explore your options and estimated tokens before you begin." : "하나의 대화에서 이어지는 모든 작업.<br>실행하기 전에, 알맞은 모델과 예상 토큰을 확인하세요."}</p><div class="hero-actions"><a class="hero-primary" href="${release}"><span aria-hidden="true">↓</span> ${en ? "Download Aurora" : "Aurora 다운로드"}</a><a class="hero-secondary" href="${en ? "/#root" : "#root"}">${en ? "Try the demo" : "웹 데모 체험하기"} <span aria-hidden="true">↗</span></a></div><p class="hero-platforms">macOS · Windows <span> / </span> ${en ? "Local web preview · no AI API calls" : "웹은 외부 AI 호출 없는 로컬 미리보기"}</p></div><div class="hero-workflow" aria-label="${en ? "Workflow" : "작업 흐름"}"><span><b>01</b> ${en ? "Describe your task" : "요청을 입력하고"}</span><i aria-hidden="true">→</i><span><b>02</b> ${en ? "Review model & tokens" : "모델과 토큰을 검토한 뒤"}</span><i aria-hidden="true">→</i><span><b>03</b> ${en ? "Choose how to proceed" : "실행 방법을 선택하세요"}</span></div><a class="hero-scroll" href="${en ? "#overview" : "#root"}">${en ? "Explore the workspace" : "작업 공간 살펴보기"} <span aria-hidden="true">↓</span></a></section>`;
}
const styles = `@font-face{font-family:SUITE;src:url('/fonts/SUITE-Variable.woff2') format('woff2');font-weight:100 900;font-display:swap}html{scroll-behavior:smooth}body{margin:0;color:#34342f;background:#faf9f6;font-family:SUITE,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}button,input,select,textarea{font:inherit}code,pre{font-family:ui-monospace,SFMono-Regular,Consolas,SUITE,monospace}.site-nav{height:52px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 28px;border-bottom:1px solid #e8e6df;background:#faf9f6}.site-nav nav{display:flex;gap:20px}.site-nav a,.site-content a,.site-footer a{color:#48684c;text-underline-offset:4px}.site-brand{font-weight:750;text-decoration:none}.site-content{max-width:1000px;margin:auto;padding:76px 28px;line-height:1.85}.site-content h1,.site-content h2{line-height:1.3;letter-spacing:-.035em}.site-content h1,.site-content>.site-hero h2{font-size:clamp(30px,4vw,48px);max-width:840px;margin:20px 0}.site-content h2{margin:54px 0 24px;font-size:28px}.site-content h3{font-size:20px;margin:0 0 12px}.site-lead{max-width:800px;color:#65665c;font-size:18px}.site-eyebrow{color:#607b64;font-size:13px;letter-spacing:.08em}.site-actions{display:flex;flex-wrap:wrap;gap:12px;margin:28px 0}.site-actions a{padding:10px 18px;border:1px solid #cdd7c7;border-radius:9px;text-decoration:none}.site-actions a:first-child{background:#607b64;color:#fff}.site-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.site-card,.site-limit{border:1px solid #e8e6df;border-radius:16px;padding:26px;background:#fffefa}.site-card p{margin:0;color:#65665c}.site-content details{border-bottom:1px solid #e8e6df;padding:18px 0}.site-content summary{cursor:pointer;font-weight:650}.site-content details p{color:#65665c}.site-footer{padding:24px 28px;border-top:1px solid #e8e6df;text-align:center;font-size:14px}.site-skip{position:absolute;left:20px;top:-100px;background:#fff;padding:12px;z-index:20}.site-skip:focus{top:5px}.site-notice{padding:16px 28px;color:#65665c}.site-web-demo .app{height:calc(100dvh - 52px)}.site-web-demo .site-content{border-top:1px solid #e8e6df}@media(max-width:680px){.site-nav{padding:0 16px;font-size:13px}.site-nav nav{gap:12px}.site-nav .site-source{display:none}.site-content{padding:48px 20px}.site-grid{grid-template-columns:1fr}.site-content h2{font-size:25px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;
function body(lang) {
  const t = translations[lang];
  const tag = lang === "ko" ? "h2" : "h1";
  return `<article class="site-content" id="overview" aria-label="${t.overview}"><header class="site-hero"><p class="site-eyebrow">AURORA · AUTO ROUTER / LOW AI</p><${tag}>${t.heading}</${tag}><p class="site-lead">${t.intro}</p><div class="site-actions"><a href="${lang === "ko" ? "#root" : "/"}">${t.open}</a><a href="${release}">${t.download}</a><a href="${repo}/blob/main/README.en.md">${t.guide}</a></div></header><section><h2>${t.featureTitle}</h2><div class="site-grid">${t.features.map(([h, p]) => `<section class="site-card"><h3>${h}</h3><p>${p}</p></section>`).join("")}</div></section><section><h2>${t.faq}</h2>${t.questions.map(([q, a]) => `<details open><summary>${q}</summary><p>${a}</p></details>`).join("")}</section><section class="site-limit"><h2>${t.limitations}</h2><p>${t.limitation}</p><a href="${release}">${t.links}</a></section></article>`;
}
function head(lang, production) {
  const t = translations[lang];
  const canonical = origin + (lang === "en" ? "/en/" : "/");
  // Only claims visible in the product overview are included. No fabricated ratings or offers.
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t.title,
    alternateName: "오로라",
    url: canonical,
    description: t.description,
    isPartOf: {
      "@type": "WebSite",
      name: "Aurora",
      url: origin + "/",
      inLanguage: ["ko", "en"],
    },
    license: repo + "/blob/main/LICENSE",
    image: origin + "/social-preview.png",
    inLanguage: lang,
    sameAs: [repo],
  });
  const hash = createHash("sha256").update(schema).digest("base64");
  const csp = `default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>${t.title}</title><meta name="description" content="${escape(t.description)}"><meta name="robots" content="${production ? "index,follow,max-image-preview:large" : "noindex,nofollow"}"><link rel="canonical" href="${canonical}"><link rel="alternate" hreflang="ko" href="${origin}/"><link rel="alternate" hreflang="en" href="${origin}/en/"><link rel="alternate" hreflang="x-default" href="${origin}/"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="theme-color" content="#607b64"><meta property="og:type" content="website"><meta property="og:site_name" content="Aurora"><meta property="og:title" content="${t.title}"><meta property="og:description" content="${escape(t.description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="${lang === "ko" ? "ko_KR" : "en_US"}"><meta property="og:locale:alternate" content="${lang === "ko" ? "en_US" : "ko_KR"}"><meta property="og:image" content="${origin}/social-preview.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Aurora desktop workspace preview"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${t.title}"><meta name="twitter:description" content="${escape(t.description)}"><meta name="twitter:image" content="${origin}/social-preview.png">${verification}<script type="application/ld+json">${schema}</script><style>${styles}</style>`;
}
export async function buildWeb({
  inputDir = "dist",
  outputDir = "web-dist",
  production = process.env.VERCEL_ENV !== "preview" &&
    process.env.VERCEL_ENV !== "development",
} = {}) {
  if (path.resolve(inputDir) === path.resolve(outputDir))
    throw new Error("Web output must be separate from desktop output");
  // This directory contains only this script's generated web output.
  await rm(outputDir, { recursive: true, force: true });
  await cp(inputDir, outputDir, { recursive: true });
  const source = await readFile(path.join(inputDir, "index.html"), "utf8");
  const notice = await readFile(
    path.join(inputDir, "AI-TRAINING-NOTICE.md"),
    "utf8",
  );
  const crawlerPolicy = await readFile(
    path.join(inputDir, "robots.txt"),
    "utf8",
  );
  if (
    !notice.includes("prior written consent") ||
    !crawlerPolicy.includes("User-agent: GPTBot")
  )
    throw new Error(
      "AI notice and training-crawler policy must survive the desktop build",
    );

  const assets = [
    ...source.matchAll(
      /<(?:script\b[^>]*\bsrc=|link\b[^>]*\bhref=)["']([^"']+)["'][^>]*(?:><\/script>|>)/g,
    ),
  ].map((m) => m[0].replaceAll('"./assets/', '"/assets/'));
  for (const lang of ["ko", "en"]) {
    const t = translations[lang];
    const nav = `<a class="site-skip" href="#overview">${t.overview}</a><header class="site-nav"><a class="site-brand" href="/"><span class="site-brand-icon" aria-hidden="true">✦</span> Aurora</a><nav aria-label="${t.overview}"><a href="${lang === "ko" ? "#overview" : "/"}">${lang === "ko" ? t.overview : t.demo}</a><a class="site-source" href="${repo}">GitHub</a><a href="${t.other}" lang="${lang === "ko" ? "en" : "ko"}" hreflang="${lang === "ko" ? "en" : "ko"}">${t.language}</a></nav></header>`;
    const demo =
      lang === "ko"
        ? `<section class="demo-shell" aria-label="Aurora web preview"><div class="demo-chrome"><span><i></i><i></i><i></i></span><p>Aurora <span>/</span> Web preview</p><a href="#overview">제품 소개 ↗</a></div><div id="root"><section class="site-notice"><h1>${t.heading}</h1><p>${t.browser}</p></section></div><noscript><p class="site-notice">${t.nojs}</p></noscript></section>`
        : "";
    const html = `<!doctype html><html lang="${lang}"><head>${head(lang, production)}<link rel="stylesheet" href="/landing.css">${lang === "ko" ? assets.join("") : ""}</head><body class="${lang === "ko" ? "site-web-demo" : "site-english"}">${nav}${landingHero(lang)}${demo}${body(lang)}<footer class="site-footer">Aurora · <a href="${repo}/blob/main/LICENSE">MIT</a> · <a href="${release}">${t.download}</a><p>사전 서면 동의 없는 AI 학습·수집에 반대합니다. No AI training or training-data collection without prior written consent. <a href="/legal/ai-training/">AI 학습·수집 고지 / Full notice</a></p></footer></body></html>`;
    const file = path.join(
      outputDir,
      lang === "ko" ? "index.html" : "en/index.html",
    );
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  const alternate = `<xhtml:link rel="alternate" hreflang="ko" href="${origin}/"/><xhtml:link rel="alternate" hreflang="en" href="${origin}/en/"/><xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>`;
  await writeFile(
    path.join(outputDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>${origin}/</loc>${alternate}</url><url><loc>${origin}/en/</loc>${alternate}</url></urlset>`,
  );
  const robots = crawlerPolicy.replace(/^Sitemap:.*$/gm, "").trim();
  await writeFile(
    path.join(outputDir, "robots.txt"),
    production
      ? `${robots}\nSitemap: ${origin}/sitemap.xml\n`
      : robots.replace("Allow: /", "Disallow: /") + "\n",
  );
  const legal = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,follow"><title>AI 학습·수집 고지 / AI training notice — Aurora</title><link rel="canonical" href="${origin}/legal/ai-training/"><style>${styles}</style></head><body><main class="site-content">${notice
    .split("\n\n")
    .map((p, i) =>
      i === 0
        ? `<h1>${escape(p.replace(/^# /, ""))}</h1>`
        : `<p>${escape(p)}</p>`,
    )
    .join(
      "",
    )}<a href="/">Aurora</a> · <a href="/en/">English overview</a> · <a href="/AI-TRAINING-NOTICE.md">Markdown notice</a></main></body></html>`;
  await mkdir(path.join(outputDir, "legal/ai-training"), { recursive: true });
  await writeFile(path.join(outputDir, "legal/ai-training/index.html"), legal);
  await writeFile(
    path.join(outputDir, "404.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found — Aurora</title><style>${styles}</style></head><body><main class="site-content"><h1>Page not found</h1><a href="/">Aurora demo</a> · <a href="/en/">English overview</a><p><a href="/legal/ai-training/">AI 학습·수집 고지 / AI training notice</a></p></main></body></html>`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await buildWeb();
  console.log(
    "Built crawlable Korean and English web pages, sitemap and robots policy.",
  );
}
