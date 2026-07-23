"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { useDraftStore } from "@/lib/draft-store";

function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const name = searchParams.get("name");
  const receiverNickname = name ? decodeURIComponent(name) : null;
  const draft = useDraftStore((s) => s.draft);
  const hasHydrated = useDraftStore((s) => s.hasHydrated);

  const returnUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (to) params.set("to", to);
    if (name) params.set("name", name);
    const query = params.toString();
    return query ? `/write?${query}` : "/write";
  }, [to, name]);

  // 로그인 복귀 경합으로 /write에 떨어졌을 때 친구홈 작성 맥락을 복원한다
  useEffect(() => {
    if (!hasHydrated || to) return;
    if (
      draft?.entryPath === "receiver_home" &&
      draft.receiverId &&
      draft.content &&
      draft.senderNickname
    ) {
      const params = new URLSearchParams({ to: draft.receiverId });
      if (draft.receiverNickname) {
        params.set("name", draft.receiverNickname);
      }
      router.replace(`/write?${params.toString()}`);
    }
  }, [hasHydrated, to, draft, router]);

  if (to) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)] pb-8">
        <AppHeader backHref={`/u/${to}`} backLabel="친구 홈으로 돌아가기" />
        <WriteLetterForm
          receiverId={to}
          receiverNickname={receiverNickname}
          entryPath="receiver_home"
          returnUrl={returnUrl}
          completeBackPath={`/u/${to}`}
          submitLabel="쪽지 보내기"
          toLocked
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
      <div className={`min-h-0 flex-1 overflow-y-auto ${mainTabPaddingClass}`}>
        <WriteLetterForm
          receiverId={null}
          receiverNickname={null}
          entryPath="sender_home"
          returnUrl="/write"
          submitLabel="쪽지 보내기"
          fillHeight={false}
        />
      </div>
      <BottomNav />
    </main>
  );
}

export default function WritePage() {
  return (
    <Suspense>
      <WriteContent />
    </Suspense>
  );
}
