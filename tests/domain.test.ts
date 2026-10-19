import test from "node:test";
import assert from "node:assert/strict";
import {
  remainingPercent,
  resetText,
  recommend,
  parseStoredChats,
  makePreview,
} from "../src/domain.ts";
test("missing and invalid usage remain unknown; real percentages are clamped", () => {
  assert.equal(remainingPercent(null), null);
  assert.equal(remainingPercent(NaN), null);
  assert.equal(remainingPercent(28), 72);
  assert.equal(remainingPercent(120), 0);
  assert.equal(remainingPercent(-10), 100);
});
test("expired usage is not silently replenished", () => {
  assert.equal(resetText(0, 1), "초기화 확인 필요");
  assert.equal(resetText(null, 1), "초기화 시각 확인 안 됨");
  assert.equal(resetText(90 * 60000, 0), "1시간 30분 후 초기화");
});
test("complexity heuristic separates common tasks without claiming AI completion", () => {
  assert.equal(recommend("이 글을 요약해 줘").tier, "light");
  assert.equal(recommend("보안 아키텍처 설계").tier, "advanced");
  assert.equal(recommend("할 일 목록을 만들어 줘").tier, "standard");
  assert.ok(
    makePreview("요약").includes("AI 모델이 질문을 수행한 결과가 아니며"),
  );
});
test("corrupt saved data is discarded instead of crashing the app", () => {
  assert.deepEqual(parseStoredChats("{broken"), []);
  assert.deepEqual(
    parseStoredChats(
      JSON.stringify([
        { id: "1", title: "bad", messages: [null], tier: "light" },
      ]),
    ),
    [],
  );
  const chat = { id: "1", title: "valid", messages: [], tier: "light" };
  assert.deepEqual(parseStoredChats(JSON.stringify([chat])), [chat]);
});
