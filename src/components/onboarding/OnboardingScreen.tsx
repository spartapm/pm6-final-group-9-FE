"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDraftStore } from "@/lib/draft-store";
import { track } from "@/lib/analytics";
import { KakaoButton } from "@/components/ui/Button";

const SLIDES = [
  {
    step: 1,
    title: "나만의 홈 만들기",
    lines: [
      "상태메시지를 설정하고",
      "내 홈을 친구들과 공유해",
      "쪽지를 받아보세요",
    ],
    image: "/images/onboarding-slide-home.png",
    imageAlt: "쪽지함 미리보기",
  },
  {
    step: 2,
    title: "나의 마음 전하기",
    lines: ["친구에게 따뜻한 마음을 담은", "쪽지를내보세요"],
    image: "/images/onboarding-slide-write.png",
    imageAlt: "쪽지 작성 미리보기",
  },
] as const;

export function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const setAuthContext = useDraftStore((s) => s.setAuthContext);
  const returnUrl = useDraftStore((s) => s.returnUrl);
  const entryPath = useDraftStore((s) => s.entryPath);
  const clearAuthContext = useDraftStore((s) => s.clearAuthContext);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const target = returnUrl ?? "/home";
        clearAuthContext();
        router.replace(target);
      }
    });
  }, [router, returnUrl, clearAuthContext]);

  const syncIndexFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (!width) return;
    const index = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.min(Math.max(index, 0), SLIDES.length - 1));
  }, []);

  function goToSlide(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  }

  async function handleLogin() {
    setLoading(true);
    const path = entryPath ?? "DIRECT";
    const target = returnUrl ?? "/home";
    setAuthContext(path, target);
    track(path === "DIRECT" ? "login_start" : "signup_start", {
      login_type: "KAKAO",
      entry_path: path,
    });

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", target);
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div
        ref={scrollRef}
        onScroll={syncIndexFromScroll}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
      >
        {SLIDES.map((slide) => (
          <section
            key={slide.step}
            className="flex w-full shrink-0 snap-center flex-col px-6 pt-10"
          >
            <div className="flex flex-col items-center text-center">
              <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold text-black">
                Step. {slide.step}
              </span>
              <h1 className="mt-5 text-[22px] font-bold leading-snug text-[var(--color-text-body)]">
                {slide.title}
              </h1>
              <div className="mt-3 space-y-0.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {slide.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-8 w-full max-w-[320px]">
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                width={640}
                height={800}
                className="h-auto w-full"
                priority={slide.step === 1}
              />
            </div>
          </section>
        ))}
      </div>

      <div className="shrink-0 px-6 pb-10 pt-4">
        <div className="mb-5 flex items-center justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.step}
              type="button"
              aria-label={`${slide.step}번째 슬라이드`}
              onClick={() => goToSlide(index)}
              className={`h-2 w-2 rounded-full transition ${
                activeIndex === index ? "bg-black" : "bg-[#D4D4D4]"
              }`}
            />
          ))}
        </div>

        <KakaoButton disabled={loading} onClick={handleLogin}>
          {loading ? "연결 중…" : "카카오로 로그인하기"}
        </KakaoButton>
      </div>
    </main>
  );
}
