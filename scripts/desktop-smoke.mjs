import { _electron as electron, expect } from "@playwright/test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
const profile = await mkdtemp(path.join(tmpdir(), "aurora-qa-"));
await mkdir("artifacts", { recursive: true });
const errors = [];
let app;
try {
  app = await electron.launch({
    args: ["."],
    env: {
      ...process.env,
      AURORA_QA_DATA: profile,
      AURORA_DISABLE_ENV_FILE: "1",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
    },
  });
  const page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  const editor = page.getByRole("textbox", { name: "메시지", exact: true });
  const review = async (text) => {
    await editor.fill(text);
    await page.getByRole("button", { name: "요청 검토", exact: true }).click();
  };
  const proceed = () =>
    page
      .getByRole("button", { name: "이 모델로 미리보기", exact: true })
      .click();
  const settings = async () => {
    await page
      .getByRole("button", { name: "모드 및 예산 설정", exact: true })
      .click();
  };
  const close = () =>
    page.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "대화는 하나로, 생각은 자유롭게." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "새 세션", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("사용량", { exact: true })).toContainText(
    "미리보기",
  );
  await page.screenshot({ path: "artifacts/aurora-desktop.png" });
  // Preflight cancellation preserves the draft and creates no messages.
  await review("코드의 보안 아키텍처를 설계해 줘");
  await expect(page.getByRole("dialog")).toContainText("고성능 모델 추천");
  await expect(page.getByRole("dialog")).toContainText("추정 불가");
  await page.getByRole("button", { name: "다시 작성", exact: true }).click();
  await expect(editor).toHaveValue("코드의 보안 아키텍처를 설계해 줘");
  await expect(page.locator(".message")).toHaveCount(0);
  await page.getByRole("button", { name: "요청 검토", exact: true }).click();
  await page.getByLabel("이번 요청 모델").selectOption("gpt-6.1-sol");
  await proceed();
  await expect(page.getByLabel("대화 내용")).toContainText(
    "선택한 모델 등급 · 표준",
  );
  await expect(page.locator(".bundle")).toHaveCount(1);
  await review("여행 일정을 추천해 줘");
  await expect(page.getByRole("dialog")).toContainText("정리 제안");
  await expect(
    page.getByRole("button", { name: "이 모델로 미리보기", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "묶기", exact: true }).click();
  await page.screenshot({ path: "artifacts/aurora-review.png" });
  // Selecting a cleanup option does not apply it before confirmation.
  await close();
  await expect(page.locator(".bundle")).toHaveCount(1);
  await page.getByRole("button", { name: "요청 검토", exact: true }).click();
  await page.getByRole("button", { name: "묶기", exact: true }).click();
  await proceed();
  await expect(page.locator(".bundle")).toHaveCount(2);
  await expect(page.locator(".bundle-heading").first()).toContainText("묶음");
  await review("이메일 문장을 요약해 줘");
  await page.getByRole("button", { name: "보관하기", exact: true }).click();
  await proceed();
  await page.getByRole("button", { name: "보관", exact: true }).click();
  await expect(page.getByLabel("대화 내용")).toContainText("여행 일정을");
  await page.getByRole("button", { name: "복원", exact: true }).click();
  await page.getByRole("button", { name: "작업", exact: true }).click();
  await review("새로운 작업: 코드 테스트를 작성해 줘");
  await page.getByRole("button", { name: "버리기", exact: true }).click();
  await proceed();
  await page.getByRole("button", { name: "휴지통", exact: true }).click();
  await expect(page.getByLabel("대화 내용")).toContainText("이메일 문장");
  await page.getByRole("button", { name: "복원", exact: true }).click();
  await page.getByRole("button", { name: "작업", exact: true }).click();
  await expect(page.locator(".bundle")).toHaveCount(4);
  await settings();
  await page.getByLabel("계획용 토큰 예산").fill("100000");
  await page.getByText("이 기기에 대화 저장", { exact: true }).click();
  await page.getByLabel("대화 관리 모드").selectOption("legacy");
  await close();
  await expect(
    page.getByRole("button", { name: "새 세션", exact: true }),
  ).toBeVisible();
  await review("레거시 첫 번째 코드 작업");
  await proceed();
  await page.getByRole("button", { name: "새 세션", exact: true }).click();
  await review("여행 요약 레거시 두 번째");
  await expect(page.getByRole("dialog")).not.toContainText("정리 제안");
  await expect(page.getByRole("dialog")).toContainText("%");
  await proceed();
  await expect(page.locator(".chat-item")).toHaveCount(2);
  await page.getByRole("button", { name: "대화 검색", exact: true }).click();
  await page.getByLabel("대화 검색어").fill("첫 번째");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "레거시 첫 번째 코드 작업" })
    .click();
  await expect(page.getByLabel("대화 내용")).toContainText(
    "레거시 첫 번째 코드 작업",
  );
  await page.screenshot({ path: "artifacts/aurora-legacy.png" });
  await settings();
  await page.getByLabel("대화 관리 모드").selectOption("auto");
  await page.getByLabel("화면 테마").selectOption("dark");
  await close();
  await expect(page.locator(".bundle")).toHaveCount(4);
  await page.screenshot({ path: "artifacts/aurora-dark.png" });
  await page.reload();
  await expect(page.locator(".bundle")).toHaveCount(4);
  await settings();
  await expect(page.getByLabel("계획용 토큰 예산")).toHaveValue("100000");
  await page.getByLabel("대화 관리 모드").selectOption("legacy");
  await close();
  await expect(page.locator(".chat-item")).toHaveCount(2);
  await settings();
  await page.getByLabel("대화 관리 모드").selectOption("auto");
  await close();
  await editor.fill("다음 작업은 무엇일까?");
  await expect(page.locator(".draft-estimate")).toContainText("설정 예산");
  await page.setViewportSize({ width: 900, height: 700 });
  await page.screenshot({ path: "artifacts/aurora-compact.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await settings();
  await page.getByText("이 기기에 대화 저장", { exact: true }).click();
  await close();
  await page.reload();
  await expect(page.locator(".bundle")).toHaveCount(0);
  // Defaults are separate from chat persistence; missing keys must block live calls.
  expect(await page.evaluate(() => window.auroraAI.status())).toEqual({
    openai: false,
    anthropic: false,
  });
  await settings();
  await expect(page.getByLabel("내부 분석 모델", { exact: true })).toHaveValue(
    "gpt-6-luna",
  );
  await expect(page.getByLabel("기본 실행 모델", { exact: true })).toHaveValue(
    "gpt-6.1-sol",
  );
  await page
    .getByRole("button", { name: "Claude 기본값", exact: true })
    .click();
  await expect(page.getByLabel("내부 분석 모델", { exact: true })).toHaveValue(
    "claude-haiku-5-5",
  );
  await expect(page.getByLabel("기본 실행 모델", { exact: true })).toHaveValue(
    "claude-sonnet-5-5",
  );
  await page
    .getByLabel("기본 실행 모델", { exact: true })
    .selectOption("gpt-6-astra");
  await page.getByText("실제 API 사용", { exact: true }).click();
  await page.screenshot({ path: "artifacts/aurora-model-settings.png" });
  await close();
  await review("새로운 모델 설정 확인");
  await expect(page.getByLabel("이번 요청 모델")).toHaveValue("gpt-6-astra");
  await expect(
    page.getByRole("button", { name: "내부 모델로 분석", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "선택한 모델로 API 실행", exact: true }),
  ).toBeDisabled();
  await close();
  // Mock only the IPC provider boundary. No real credentials or provider calls in QA.
  await app.evaluate(({ ipcMain }) => {
    globalThis.auroraTestCalls = [];
    ipcMain.removeHandler("aurora:ai-status");
    ipcMain.handle("aurora:ai-status", () => ({
      openai: true,
      anthropic: true,
    }));
    ipcMain.removeHandler("aurora:ai-request");
    ipcMain.handle("aurora:ai-request", (_event, p) => {
      globalThis.auroraTestCalls.push(p);
      return p.action === "analyze"
        ? {
            model: p.model,
            text: "",
            summary: "모의 범위 분석",
            reason: "모의 추천 근거",
            recommendedModel: "gpt-6.1-sol",
            inputTokens: 12,
            outputTokens: 23,
            incomplete: false,
          }
        : {
            model: p.model,
            text: "모의 API 답변",
            inputTokens: 34,
            outputTokens: 45,
            incomplete: false,
          };
    });
  });
  await page.reload();
  await review("요약해 줘");
  await expect(page.getByLabel("이번 요청 모델")).toHaveValue("gpt-6-astra");
  await page
    .getByRole("button", { name: "내부 모델로 분석", exact: true })
    .click();
  await expect(page.locator(".analysis-result")).toContainText(
    "모의 범위 분석",
  );
  await expect(page.locator(".message")).toHaveCount(0);
  await page.getByLabel("이번 요청 모델").selectOption("gpt-6.1-sol");
  await page
    .getByRole("button", { name: "선택한 모델로 API 실행", exact: true })
    .click();
  await expect(page.getByLabel("대화 내용")).toContainText("모의 API 답변");
  await expect(page.locator(".message.assistant")).toContainText("API 응답");
  const calls = await app.evaluate(() => globalThis.auroraTestCalls);
  expect(calls.map((c) => [c.action, c.model])).toEqual([
    ["analyze", "claude-haiku-5-5"],
    ["execute", "gpt-6.1-sol"],
  ]);
  expect(calls.map((c) => c.maxOutputTokens)).toEqual([2048, 4096]);
  await app.evaluate(({ ipcMain }) => {
    ipcMain.removeHandler("aurora:ai-request");
    ipcMain.handle("aurora:ai-request", (_event, p) => {
      globalThis.auroraTestCalls.push(p);
      throw new Error("모의 API 오류");
    });
  });
  await review("추가 설명");
  await page
    .getByRole("button", { name: "선택한 모델로 API 실행", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("모의 API 오류");
  await expect(editor).toHaveValue("추가 설명");
  await expect(page.locator(".message")).toHaveCount(2);
  expect(await app.evaluate(() => globalThis.auroraTestCalls.length)).toBe(3);
  await close();
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
    JSON.stringify(
      {
        passed: true,
        errors,
        prefs,
        checks: [
          "preflight/cancel",
          "selected-model",
          "group/archive/trash/restore",
          "legacy-session-search",
          "mode-isolation",
          "budget-percent",
          "persistence/reload",
          "dark/compact",
          "sandbox",
          "role-defaults-and-persistence",
          "missing-key-guard",
          "mocked-analyzer-and-executor-routing",
          "API-error-retains-draft-no-retry",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "Desktop checks passed: single stream, preflight, cleanup and restore, legacy mode isolation, estimates, storage and layout.",
  );
} finally {
  await app?.close();
  console.log(`QA profile retained: ${profile}`);
}
