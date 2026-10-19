import catalog from "./catalog.json";
import type { Tier } from "./domain";
export type Provider = "openai" | "anthropic";
export type Model = {
  id: string;
  name: string;
  provider: Provider;
  tier: Tier;
};
export const models = catalog as Model[];
export const modelById = (id: string) => models.find((m) => m.id === id)!;
export const ROUTING_KEY = "aurora.routing.v1";
export type RoutingSettings = {
  analyzer: string;
  executor: string;
  live: boolean;
};
export const presets: Record<Provider, RoutingSettings> = {
  openai: { analyzer: "gpt-6-luna", executor: "gpt-6.1-sol", live: false },
  anthropic: {
    analyzer: "claude-haiku-5-5",
    executor: "claude-sonnet-5-5",
    live: false,
  },
};
export function readRouting(raw: string | null): RoutingSettings {
  try {
    const d = JSON.parse(raw ?? "null");
    if (
      d &&
      models.some((m) => m.id === d.analyzer) &&
      models.some((m) => m.id === d.executor) &&
      typeof d.live === "boolean"
    )
      return d;
  } catch {}
  return { ...presets.openai };
}
export type ProviderStatus = Record<Provider, boolean>;
export type Completion = {
  text: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  incomplete: boolean;
};
export type Analysis = Completion & {
  summary: string;
  reason: string;
  recommendedModel: string;
};
export type AIRequest = {
  action: "analyze" | "execute";
  model: string;
  text: string;
  context: { role: "user" | "assistant"; text: string }[];
  maxOutputTokens: number;
};
export interface AIBridge {
  status(): Promise<ProviderStatus>;
  request(payload: AIRequest): Promise<Completion | Analysis>;
}
declare global {
  interface Window {
    auroraAI?: AIBridge;
  }
}
