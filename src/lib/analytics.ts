import { isPostHogEnabled, loadPostHog } from "@/lib/posthog";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  if (isPostHogEnabled) {
    // 로드 완료를 보장한 뒤 캡처 (초기 이벤트 유실 방지)
    loadPostHog().then((ph) => ph?.capture(event, payload));
    return;
  }

  // PostHog 키 미설정 시: 개발 환경에서만 콘솔 출력, 그 외엔 no-op
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event, payload);
  }
}
