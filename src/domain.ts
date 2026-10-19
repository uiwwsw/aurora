export type Tier = "light" | "standard" | "advanced";
export const tierNames: Record<Tier, string> = {
  light: "경량",
  standard: "표준",
  advanced: "고성능",
};
export type Message = { id: string; role: "user" | "assistant"; text: string };
export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  tier: Tier;
};
export type Bundle = Chat & {
  status: "active" | "grouped" | "archived" | "trashed";
};
export type Workspace = {
  version: 2;
  mode: "auto" | "legacy";
  bundles: Bundle[];
  legacyChats: Chat[];
  save: boolean;
  budget: number | null;
};
export type Estimate = {
  tier: Tier;
  reason: string;
  input: number;
  output: [number, number];
  total: [number, number];
  percent: [number, number] | null;
};
export type Proposal = { bundleId: string; reason: string };
export const STORAGE_KEY = "aurora.workspace.v2";
export const LEGACY_KEY = "aurora.workspace.v1";
export function emptyWorkspace(): Workspace {
  return {
    version: 2,
    mode: "auto",
    bundles: [],
    legacyChats: [],
    save: false,
    budget: null,
  };
}
export function remainingPercent(used: number | null): number | null {
  return used === null || !Number.isFinite(used)
    ? null
    : Math.max(0, Math.min(100, 100 - used));
}
export function resetText(at: number | null, now: number): string {
  if (at === null) return "초기화 시각 확인 안 됨";
  const minutes = Math.ceil((at - now) / 60000);
  if (minutes <= 0) return "초기화 확인 필요";
  if (minutes >= 1440)
    return `${Math.floor(minutes / 1440)}일 ${Math.floor((minutes % 1440) / 60)}시간 후 초기화`;
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 후 초기화`
    : `${minutes}분 후 초기화`;
}
export function tokens(text: string): number {
  return Math.ceil(
    [...text].reduce(
      (sum, ch) => sum + (/[^\x00-\x7F]/.test(ch) ? 1.5 : 0.3),
      0,
    ),
  );
}
export function recommend(prompt: string) {
  const complex =
    /아키텍처|설계|보안|마이그레이션|동시성|증명|architecture|security|migration|concurrency/i.test(
      prompt,
    );
  const simple = /번역|요약|맞춤법|제목|translate|summari[sz]e/i.test(prompt);
  const tier: Tier =
    complex || prompt.length > 1800
      ? "advanced"
      : simple && prompt.length < 600
        ? "light"
        : "standard";
  const reasons = {
    light: "짧은 변환·정리 작업이므로 경량 모델부터 권장합니다.",
    standard: "일반적인 작성·문제 해결에 적합한 표준 모델을 권장합니다.",
    advanced: "복잡한 조건과 검토가 필요해 고성능 모델을 권장합니다.",
  };
  return { tier, reason: reasons[tier], tokens: tokens(prompt) };
}
export function estimate(
  prompt: string,
  context: Message[],
  budget: number | null,
  chosen?: Tier,
): Estimate {
  const recommendation = recommend(prompt);
  const outputRanges: Record<Tier, [number, number]> = {
    light: [200, 800],
    standard: [500, 2000],
    advanced: [1200, 5000],
  };
  const output = outputRanges[chosen ?? recommendation.tier];
  const input =
    tokens(prompt) +
    context.reduce((sum, m) => sum + tokens(m.text) + 8, 0) +
    120;
  const total: [number, number] = [input + output[0], input + output[1]];
  return {
    tier: recommendation.tier,
    reason: recommendation.reason,
    input,
    output,
    total,
    percent:
      budget !== null && Number.isFinite(budget) && budget > 0
        ? [(total[0] / budget) * 100, (total[1] / budget) * 100]
        : null,
  };
}
function topic(text: string): string | null {
  const topics = [
    ["code", /코드|개발|앱|버그|함수|설계|아키텍처|code|debug|software/i],
    ["writing", /번역|요약|글|문장|이메일|translate|summari[sz]e|writing/i],
    ["travel", /여행|항공|호텔|맛집|travel|hotel/i],
  ] as const;
  return topics.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
export function propose(
  bundles: Bundle[],
  nextPrompt: string,
): Proposal | null {
  const current = bundles.findLast((b) => b.status === "active");
  if (!current?.messages.some((m) => m.role === "user")) return null;
  const last = current.messages.filter((m) => m.role === "user").at(-1)!.text;
  const changed =
    /다른 (일|주제|작업)|새로운 (일|주제|작업)|이제 .*대신|주제.*바꿔|다음 작업/.test(
      nextPrompt,
    ) ||
    (topic(last) !== null &&
      topic(nextPrompt) !== null &&
      topic(last) !== topic(nextPrompt));
  const finished = /여기까지|완료했|끝났|마무리|수고했|고마워/.test(nextPrompt);
  return changed || finished
    ? {
        bundleId: current.id,
        reason: changed
          ? "이전 작업과 다른 주제로 보여요."
          : "지금 작업이 마무리된 것 같아요.",
      }
    : null;
}
export function organize(
  bundles: Bundle[],
  id: string,
  action: "grouped" | "archived" | "trashed",
): Bundle[] {
  return bundles.map((b) => (b.id === id ? { ...b, status: action } : b));
}
export function activeContext(bundles: Bundle[]): Message[] {
  return bundles
    .filter((b) => b.status === "active")
    .flatMap((b) => b.messages);
}
function validChat(item: unknown): item is Chat {
  if (!item || typeof item !== "object") return false;
  const c = item as Chat;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    ["light", "standard", "advanced"].includes(c.tier) &&
    Array.isArray(c.messages) &&
    c.messages.every(
      (m) =>
        m &&
        typeof m.id === "string" &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.text === "string",
    )
  );
}
export function parseStoredChats(raw: string | null): Chat[] {
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    return Array.isArray(data) ? data.filter(validChat) : [];
  } catch {
    return [];
  }
}
export function restoreWorkspace(
  raw: string | null,
  legacy: string | null,
): Workspace {
  if (raw) {
    try {
      const d = JSON.parse(raw);
      if (
        d.version === 2 &&
        ["auto", "legacy"].includes(d.mode) &&
        Array.isArray(d.bundles) &&
        d.bundles.every(
          (b: Bundle) =>
            validChat(b) &&
            ["active", "grouped", "archived", "trashed"].includes(b.status),
        ) &&
        Array.isArray(d.legacyChats) &&
        d.legacyChats.every(validChat) &&
        typeof d.save === "boolean" &&
        (d.budget === null || (Number.isFinite(d.budget) && d.budget > 0))
      )
        return d;
    } catch {
      /* Keep migration source intact when storage is corrupt. */
    }
  }
  const old = parseStoredChats(legacy);
  return {
    ...emptyWorkspace(),
    legacyChats: old,
    save: old.length > 0,
    mode: old.length ? "legacy" : "auto",
  };
}
export function makePreview(
  prompt: string,
  tier: Tier = recommend(prompt).tier,
): string {
  return `선택한 모델 등급 · ${tierNames[tier]}\n\n요청을 로컬 작업 흐름에 기록했습니다. 현재는 규칙 기반 추천과 정리 제안을 확인하는 미리보기입니다.\nAI 모델이 질문을 수행한 결과가 아니며, 실제 토큰이나 계정 한도는 차감되지 않습니다.`;
}
