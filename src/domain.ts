export type Tier = "light" | "standard" | "advanced";
export type Message = { id: string; role: "user" | "assistant"; text: string };
export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  tier: Tier;
};
export type UsageWindow = {
  id: string;
  label: string;
  usedPercent: number | null;
  resetsAt: number | null;
};
export const tierNames: Record<Tier, string> = {
  light: "경량",
  standard: "표준",
  advanced: "고성능",
};
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
  if (minutes >= 60)
    return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분 후 초기화`;
  return `${minutes}분 후 초기화`;
}
export function recommend(prompt: string): {
  tier: Tier;
  reason: string;
  tokens: number;
} {
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
  const reasons: Record<Tier, string> = {
    light: "짧은 변환·정리 작업으로 보입니다. 경량 모델부터 시도해 보세요.",
    standard:
      "일반적인 작성·문제 해결 작업으로 보입니다. 표준 모델부터 시도해 보세요.",
    advanced: "복잡한 조건이나 설계 검토가 포함되어 고성능 모델을 추천합니다.",
  };
  return {
    tier,
    reason: reasons[tier],
    tokens: Math.max(
      1,
      Math.ceil(
        [...prompt].reduce(
          (sum, ch) => sum + (/[^\x00-\x7F]/.test(ch) ? 1.5 : 0.3),
          0,
        ),
      ),
    ),
  };
}
export function makePreview(prompt: string): string {
  const result = recommend(prompt);
  return `추천 모델 등급 · ${tierNames[result.tier]}\n\n${result.reason}\n\n예상 입력 토큰은 약 ${result.tokens.toLocaleString()}개입니다. 글자 수에 기반한 대략적인 추정이며, 실제 모델과 토크나이저에 따라 달라집니다.\n\n이 응답은 Aurora의 로컬 추천 미리보기입니다. AI 모델이 질문을 수행한 결과가 아니며, 실제 사용량은 차감되지 않습니다.`;
}
export const STORAGE_KEY = "aurora.workspace.v1";
export function parseStoredChats(raw: string | null): Chat[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length > 100) return [];
    return data.filter(
      (item): item is Chat =>
        !!item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        ["light", "standard", "advanced"].includes(item.tier) &&
        Array.isArray(item.messages) &&
        item.messages.length <= 500 &&
        item.messages.every(
          (m: Message) =>
            m &&
            typeof m.id === "string" &&
            ["user", "assistant"].includes(m.role) &&
            typeof m.text === "string",
        ),
    );
  } catch {
    return [];
  }
}
