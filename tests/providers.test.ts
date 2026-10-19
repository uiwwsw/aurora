import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readRouting, presets, models } from "../src/routing.ts";
const require = createRequire(import.meta.url);
const { request, status, validate } = require("../electron/providers.cjs");
const payload = {
  action: "execute",
  model: "gpt-6.1-sol",
  text: "테스트 질문",
  context: [],
  maxOutputTokens: 4096,
};
const json = (body: unknown) => ({ ok: true, json: async () => body });
test("role defaults are independent, validated, and provider-specific", () => {
  assert.notEqual(presets.openai.analyzer, presets.openai.executor);
  assert.equal(presets.anthropic.analyzer, "claude-haiku-5-5");
  assert.equal(readRouting("{bad").executor, "gpt-6.1-sol");
  assert.equal(
    readRouting(
      JSON.stringify({ analyzer: "bad", executor: "gpt-6.1-sol", live: true }),
    ).live,
    false,
  );
  assert.equal(models.length, 6);
});
test("missing key blocks a call before any network traffic", async () => {
  let calls = 0;
  await assert.rejects(
    request(payload, {
      env: {},
      fetchImpl: () => {
        calls++;
      },
    }),
    /OPENAI_API_KEY/,
  );
  assert.equal(calls, 0);
  assert.deepEqual(status({ ANTHROPIC_API_KEY: "test" }), {
    openai: false,
    anthropic: true,
  });
});
test("OpenAI adapter uses fixed endpoint, selected model, no store, usage and cap", async () => {
  let seen: any;
  const result = await request(payload, {
    env: { OPENAI_API_KEY: "unit-test-key" },
    fetchImpl: async (url: string, opts: any) => {
      seen = { url, opts, body: JSON.parse(opts.body) };
      return json({
        output: [{ content: [{ type: "output_text", text: "答え" }] }],
        usage: { input_tokens: 22, output_tokens: 33 },
        status: "completed",
      });
    },
  });
  assert.equal(seen.url, "https://api.openai.com/v1/responses");
  assert.equal(seen.opts.redirect, "error");
  assert.equal(seen.body.model, payload.model);
  assert.equal(seen.body.store, false);
  assert.equal(seen.body.max_output_tokens, 4096);
  assert.equal(result.inputTokens, 22);
  assert.equal(result.text, "答え");
});
test("Anthropic adapter maps roles, headers and incomplete output separately", async () => {
  let body: any;
  const result = await request(
    {
      ...payload,
      model: "claude-sonnet-5-5",
      context: [{ role: "user", text: "前文" }],
    },
    {
      env: { ANTHROPIC_API_KEY: "unit-test-key" },
      fetchImpl: async (url: string, opts: any) => {
        assert.equal(url, "https://api.anthropic.com/v1/messages");
        assert.equal(opts.headers["anthropic-version"], "2023-06-01");
        body = JSON.parse(opts.body);
        return json({
          content: [{ type: "text", text: "部分" }],
          usage: { input_tokens: 3, output_tokens: 7 },
          stop_reason: "max_tokens",
        });
      },
    },
  );
  assert.equal(body.max_tokens, 4096);
  assert.equal(body.messages[0].content, "前文");
  assert.equal(result.incomplete, true);
});
test("analyzer never executes user task and validates model recommendation", async () => {
  let system = "";
  const result = await request(
    {
      ...payload,
      action: "analyze",
      model: "gpt-6-luna",
      maxOutputTokens: 2048,
    },
    {
      env: { OPENAI_API_KEY: "test" },
      fetchImpl: async (_: string, opts: any) => {
        system = JSON.parse(opts.body).instructions;
        return json({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    summary: "작업 범위",
                    reason: "비교 이유",
                    recommendedModel: "claude-sonnet-5-5",
                  }),
                },
              ],
            },
          ],
        });
      },
    },
  );
  assert.match(system, /never execute/);
  assert.equal(result.recommendedModel, "claude-sonnet-5-5");
  await assert.rejects(
    request(
      { ...payload, action: "analyze" },
      {
        env: { OPENAI_API_KEY: "test" },
        fetchImpl: async () => json({ output: [] }),
      },
    ),
    /유효한 분석/,
  );
});
test("errors do not expose provider response body or retry calls", async () => {
  let calls = 0;
  await assert.rejects(
    request(payload, {
      env: { OPENAI_API_KEY: "secret-unit-value" },
      fetchImpl: async () => {
        calls++;
        return {
          ok: false,
          status: 401,
          text: async () => "secret-unit-value",
        };
      },
    }),
    (error) =>
      error instanceof Error &&
      error.message.includes("401") &&
      !error.message.includes("secret-unit-value"),
  );
  assert.equal(calls, 1);
  assert.throws(() => validate({ ...payload, model: "https://evil.invalid" }));
  assert.throws(() => validate({ ...payload, maxOutputTokens: 999999 }));
});
