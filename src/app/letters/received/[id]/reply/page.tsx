"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { LetterDetailSkeleton } from "@/components/common/ContentSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useMyProfile, useReceivedLetter } from "@/lib/queries";
import { ApiError } from "@/lib/api-client";

export default function ReplyLetterPage() {
  const params = useParams<{ id: string }>();
  const { data: letter, error, isPending, refetch } = useReceivedLetter(
    params.id
  );
  const { data: me } = useMyProfile();

  if (error && !letter) {
    const message =
      error instanceof ApiError && error.status === 404
        ? "쪽지를 찾을 수 없어요."
        : "쪽지를 불러오지 못했어요.";
    return (
      <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
        <AppHeader
          backHref={`/letters/received/${params.id}`}
          variant="content"
        />
        <ErrorState title={message} onRetry={() => refetch()} />
      </main>
    );
  }

  if (!letter || isPending) {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
        <AppHeader
          backHref={`/letters/received/${params.id}`}
          variant="content"
        />
        <LetterDetailSkeleton />
      </main>
    );
  }

  // To = 원본 From, From = 원본 To(또는 내 닉네임)
  const toNickname = letter.sender_nickname;
  const fromNickname =
    letter.receiver_nickname?.trim() || me?.nickname || "나";

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)] pb-8">
      <AppHeader
        backHref={`/letters/received/${params.id}`}
        backLabel=""
        variant="content"
      />
      <WriteLetterForm
        receiverId={letter.sender_id}
        receiverNickname={toNickname}
        initialSenderNickname={fromNickname}
        entryPath="receiver_home"
        returnUrl={`/letters/received/${params.id}/reply`}
        completeBackPath="/home?tab=sent"
        replyToLetterId={letter.id}
        toLocked
        fromLocked
        showTitle={false}
        guideText="답장 쪽지를 작성해주세요"
        submitLabel="쪽지 보내기"
      />
    </main>
  );
}
