import { _electron as electron, expect } from "@playwright/test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

if (!process.env.TMPDIR?.startsWith("/Volumes/DevBuild/"))
  throw new Error("Use ./dev npm run test:desktop");
const profile = await mkdtemp(path.join(process.env.TMPDIR, "aurora-qa-"));
await mkdir("artifacts", { recursive: true });
const errors = [];
let app;
try {
  app = await electron.launch({
    args: ["."],
    env: { ...process.env, AURORA_QA_DATA: profile },
  });
  const page = await app.firstWindow();
  page.on("pageerror", (error) => errors.push(error.message));
  await expect(
    page.getByRole("heading", { name: "무엇부터 시작할까요?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: "5시간 한도 남은 비율" }),
  ).toHaveAttribute("aria-valuenow", "72");
  await page.screenshot({ path: "artifacts/aurora-desktop.png" });
  // Unknown usage must never appear as a full remaining allowance.
  await page.getByRole("button", { name: "샘플 끄기" }).click();
  await expect(
    page.getByRole("progressbar", { name: "5시간 한도 남은 비율" }),
  ).toHaveAttribute("aria-valuetext", "데이터 없음");
  await expect(
    page.getByRole("progressbar", { name: "5시간 한도 남은 비율" }),
  ).not.toHaveAttribute("aria-valuenow");
  await page.getByRole("button", { name: "샘플 보기" }).click();
  await page.getByRole("button", { name: "가볍게 정리하기" }).click();
  await expect(
    page.getByRole("textbox", { name: "메시지", exact: true }),
  ).not.toBeEmpty();
  await page
    .getByRole("textbox", { name: "메시지", exact: true })
    .fill("분산 시스템 보안 아키텍처를 설계해 줘");
  await page.getByRole("button", { name: "메시지 보내기" }).click();
  await expect(page.getByLabel("대화 내용")).toContainText(
    "추천 모델 등급 · 고성능",
  );
  await expect(page.getByLabel("대화 내용")).toContainText(
    "로컬 추천 미리보기",
  );
  await page.getByRole("button", { name: "대화 검색" }).click();
  await page.getByLabel("대화 검색어").fill("분산");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "분산 시스템 보안 아키텍처를 설계해 줘" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "사용량 및 데이터 설정" }).click();
  await page.getByLabel("화면 테마").selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByText("이 기기에 대화 저장", { exact: true }).click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await expect(page.locator(".chat-item")).toHaveCount(1);
  await page.locator(".chat-item").first().click();
  await expect(page.getByLabel("대화 내용")).toContainText("분산 시스템");
  await page.getByRole("button", { name: "사용량 및 데이터 설정" }).click();
  await page.getByText("이 기기에 대화 저장", { exact: true }).click();
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.reload();
  await expect(page.locator(".chat-item")).toHaveCount(0);
  await page.setViewportSize({ width: 900, height: 700 });
  await expect(
    page.getByRole("button", { name: "메시지 보내기" }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/aurora-compact.png" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const p =
      BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return {
      sandbox: p.sandbox,
      nodeIntegration: p.nodeIntegration,
      contextIsolation: p.contextIsolation,
    };
  });
  expect(prefs).toEqual({
    sandbox: true,
    nodeIntegration: false,
    contextIsolation: true,
  });
  expect(errors).toEqual([]);
  await writeFile(
    "artifacts/smoke-result.json",
    JSON.stringify({ passed: true, errors, prefs }, null, 2),
  );
  console.log(
    "Desktop checks passed: usage unknown/demo, compose, recommend, search, theme, persistence opt-in/out, compact layout, sandbox.",
  );
} finally {
  await app?.close();
  console.log(`QA profile retained on SSD: ${profile}`);
}
