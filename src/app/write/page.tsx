"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";

function WriteContent() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to");
  const name = searchParams.get("name");
  const receiverNickname = name ? decodeURIComponent(name) : null;

  const returnUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (to) params.set("to", to);
    if (name) params.set("name", name);
    const query = params.toString();
    return query ? `/write?${query}` : "/write";
  }, [to, name]);

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
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
      <div className="h-4 shrink-0" />
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
