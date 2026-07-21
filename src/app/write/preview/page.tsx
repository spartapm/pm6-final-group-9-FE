"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { LetterPaperCard } from "@/components/letter/LetterPaperCard";
import { PrimaryButton } from "@/components/ui/Button";
import { toast } from "@/components/common/Toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { useDraftStore } from "@/lib/draft-store";
import { createClient } from "@/lib/supabase/client";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import type { Letter } from "@/types";

export default function WritePreviewPage() {
  const router = useRouter();
  const draft = useDraftStore((s) => s.draft);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    // 전송 완료 후 clearDraft로 draft가 비워질 때 /write로 튕기지 않도록 가드
    if (sendingRef.current) return;
    if (!draft?.content || !draft.senderNickname) {
      router.replace("/write");
    }
  }, [draft, router]);

  if (!draft?.content || !draft.senderNickname) {
    return (
      <main className="min-h-screen bg-[var(--color-bg-content)]" aria-busy />
    );
  }

  const toLabel = draft.receiverNickname?.trim() || "친구";
  const fromLabel = draft.senderNickname.trim();
  const backHref =
    draft.entryPath === "receiver_home" && draft.receiverId
      ? `/write?to=${draft.receiverId}&name=${encodeURIComponent(toLabel)}`
      : draft.replyToLetterId
        ? `/letters/received/${draft.replyToLetterId}`
        : "/write";

  async function sendLetter() {
    if (sendingRef.current || !draft) return;
    sendingRef.current = true;
    setSending(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirectToOnboarding(router, "MESSAGE_WRITE", "/write/preview");
        return;
      }

      const res = await apiFetch<{
        data: { letter: Letter; shareUrl: string | null };
      }>("/letters", {
        method: "POST",
        body: JSON.stringify({
          receiverId: draft.receiverId,
          content: draft.content,
          senderNickname: draft.senderNickname,
          receiverNickname: draft.receiverNickname,
          isAnonymous: false,
          entryPath: draft.entryPath,
          replyToLetterId: draft.replyToLetterId ?? null,
        }),
      });

      track("card_write_complete", {
        letter_id: res.data.letter.id,
        entry_path: draft.entryPath,
      });

      clearDraft();

      if (res.data.shareUrl) {
        router.replace(
          `/send/complete?type=link&url=${encodeURIComponent(res.data.shareUrl)}`
        );
      } else {
        const backTo =
          draft.completeBackPath ??
          (draft.receiverId ? `/u/${draft.receiverId}` : "/home");
        router.replace(
          `/send/complete?type=direct&back=${encodeURIComponent(backTo)}`
        );
      }
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "전송에 실패했어요. 다시 시도해주세요"
      );
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <main
      className={`flex min-h-screen flex-col bg-[var(--color-bg-content)] ${mainTabPaddingClass}`}
    >
      <AppHeader
        backHref={backHref}
        backLabel="돌아가서 수정하기"
        variant="content"
      />

      <div className="flex flex-1 flex-col px-[30px] pb-8 pt-16">
        <h1 className="text-center text-[20px] font-semibold tracking-[-0.22px] text-[#484848]">
          쪽지가 완성되었어요!
        </h1>

        <div className="mt-10 flex flex-1 flex-col items-center justify-center">
          <LetterPaperCard
            toLabel={toLabel}
            fromLabel={fromLabel}
            content={draft.content}
          />
        </div>

        <div className="mt-auto pt-8">
          <PrimaryButton disabled={sending} onClick={sendLetter}>
            {sending ? "보내는 중…" : "쪽지 보내기"}
          </PrimaryButton>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
