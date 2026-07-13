"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadPostHog, isPostHogEnabled } from "@/lib/posthog";

/** 라우트 변경마다 $pageview 캡처 (App Router 수동 방식) */
function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    loadPostHog().then((ph) => {
      if (!ph) return;
      let url = window.origin + pathname;
      const qs = searchParams?.toString();
      if (qs) url += `?${qs}`;
      ph.capture("$pageview", { $current_url: url });
    });
  }, [pathname, searchParams]);

  return null;
}

/** 로그인 상태에 따라 유저를 식별(identify)/초기화(reset) */
function PostHogIdentify() {
  useEffect(() => {
    if (!isPostHogEnabled) return;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      loadPostHog().then((ph) => {
        if (!ph) return;
        if (session?.user) {
          ph.identify(session.user.id, {
            email: session.user.email ?? undefined,
          });
        } else if (event === "SIGNED_OUT") {
          ph.reset();
        }
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 마운트 시 즉시 로드/초기화(autocapture 시작)
    loadPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <PostHogIdentify />
      {children}
    </>
  );
}
