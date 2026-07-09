"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDraftStore } from "@/lib/draft-store";
import { track } from "@/lib/analytics";
import { KakaoButton } from "@/components/ui/Button";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  async function handleLogin() {
    setLoading(true);
    const path = entryPath ?? "DIRECT";
    setAuthContext(path, returnUrl ?? "/home");
    track("login_start", { login_type: "KAKAO", entry_path: path });

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });
  }

  const error = searchParams.get("error");

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-8 pt-8">
        <Image
          src="/images/splash-pigeon.png"
          alt="구구"
          width={176}
          height={148}
          priority
          className="h-auto w-[176px]"
        />
        <Image
          src="/images/splash-logo-gugu-letter.png"
          alt="GUGU LETTER"
          width={160}
          height={98}
          priority
          className="mt-10 h-auto w-[160px]"
        />
        <h1 className="mt-12 text-center text-[22px] font-extrabold leading-snug text-[#8A8A8A]">
          소중한 마음을
          <br />
          쪽지로 전해보세요
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-[#A8A8A8]">
          친구에게 링크를 공유하고
          <br />
          따뜻한 쪽지를 주고받아보세요
        </p>
      </div>

      <div className="space-y-3 px-6 pb-10 pt-6">
        {error ? (
          <p className="text-center text-sm text-[var(--color-error,#EF4444)]">
            로그인에 실패했어요. 다시 시도해주세요.
          </p>
        ) : null}
        <KakaoButton disabled={loading} onClick={handleLogin}>
          {loading ? "연결 중…" : "카카오로 시작하기"}
        </KakaoButton>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
