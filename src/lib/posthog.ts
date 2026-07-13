import type { PostHog } from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

/** 키가 세팅된 경우에만 PostHog를 활성화한다. (미설정 시 전부 no-op) */
export const isPostHogEnabled = Boolean(POSTHOG_KEY);

let instance: PostHog | null = null;
let loadingPromise: Promise<PostHog | null> | null = null;

/**
 * PostHog를 지연 로드 + 초기화한다.
 * - 키가 없거나 서버면 null 반환 (posthog-js 청크 자체를 받지 않음)
 * - 여러 번 호출해도 한 번만 초기화
 */
export function loadPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !isPostHogEnabled) {
    return Promise.resolve(null);
  }
  if (instance) return Promise.resolve(instance);
  if (!loadingPromise) {
    loadingPromise = import("posthog-js").then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY as string, {
        api_host: POSTHOG_HOST,
        // 클릭/입력 등 UI 이벤트 자동 수집
        autocapture: true,
        // App Router에서는 라우트 변경 시 수동으로 $pageview 캡처
        capture_pageview: false,
        capture_pageleave: true,
        // 익명 이벤트는 수집하되, person 프로필은 로그인(identify) 시에만 생성
        person_profiles: "identified_only",
        persistence: "localStorage+cookie",
      });
      instance = posthog;
      return instance;
    });
  }
  return loadingPromise;
}

/** 이미 초기화된 인스턴스를 동기적으로 반환 (없으면 null) */
export function getPostHog(): PostHog | null {
  return instance;
}
