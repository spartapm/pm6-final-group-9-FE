"use client";

import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useDraftStore } from "@/lib/draft-store";
import { track } from "@/lib/analytics";
import { KakaoButton } from "@/components/ui/Button";
import type { EntryPath } from "@/types";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  message?: string;
  entryPath?: EntryPath;
  returnUrl?: string;
};

export function LoginModal({
  open,
  onClose,
  message = "로그인이 필요해요.",
  entryPath = "DIRECT",
  returnUrl = "/home",
}: LoginModalProps) {
  const setAuthContext = useDraftStore((s) => s.setAuthContext);

  if (!open) return null;

  async function handleKakaoLogin() {
    setAuthContext(entryPath, returnUrl);
    track(entryPath === "DIRECT" ? "login_start" : "signup_start", {
      login_type: "KAKAO",
      entry_path: entryPath,
    });

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center">
      <div className="w-full max-w-[390px] rounded-t-[24px] bg-white px-6 pb-8 pt-6 sm:rounded-[24px]">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--color-border)] sm:hidden" />
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
            <Image src="/images/logo-gugu-circle.svg" alt="" width={40} height={40} />
          </div>
          <p className="text-lg font-bold text-[var(--color-text)]">{message}</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            카카오 계정으로 간편하게 시작해요.
          </p>
        </div>
        <KakaoButton onClick={handleKakaoLogin}>
          카카오로 로그인하기
        </KakaoButton>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-3 text-sm text-[var(--color-text-muted)]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
