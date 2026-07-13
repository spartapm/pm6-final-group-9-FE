"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LetterDetailSkeleton } from "@/components/common/ContentSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { ApiError } from "@/lib/api-client";
import { useSentLetter } from "@/lib/queries";
import { REACTION_LABELS } from "@/types";

function formatLetterDate(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
}

function SentLetterCard({
  receiverLabel,
  content,
}: {
  receiverLabel: string;
  content: string;
}) {
  return (
    <article className="w-full rounded-[16px] border border-black bg-white px-6 py-5">
      <p className="text-[18px] font-semibold text-[#1F1F1F]">
        To. {receiverLabel}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-[14px] leading-[1.5] tracking-[-0.32px] text-[#191F28]">
        {content}
      </p>
    </article>
  );
}

function DetailHeader() {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center bg-[var(--color-bg-content)] px-3 pt-[env(safe-area-inset-top)]">
      <Link
        href="/home?tab=sent"
        className="flex h-10 w-10 items-center justify-center text-[#474747]"
        aria-label="뒤로"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14.5 5 8 11.5 14.5 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </header>
  );
}

export default function SentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: letter, error, refetch, isPending } = useSentLetter(params.id);

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      redirectToOnboarding(router, "DIRECT", `/letters/sent/${params.id}`);
    }
  }, [error, params.id, router]);

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? "접근 할 수 없는 화면이에요"
      : error instanceof ApiError && error.status === 404
        ? "존재하지 않는 쪽지예요"
        : error
          ? "쪽지를 불러오지 못했어요. 다시 시도해주세요"
          : null;

  if (errorMessage && !letter) {
    return (
      <main className="flex h-[100dvh] flex-col bg-[var(--color-bg-content)]">
        <DetailHeader />
        <ErrorState title={errorMessage} onRetry={() => refetch()} />
      </main>
    );
  }

  const receiverLabel = letter
    ? (letter.receiver_nickname ?? "친구")
    : "";
  const isLinkUnclaimed =
    letter?.delivery_type === "link" && !letter.receiver_id;
  const unread = letter ? !letter.read_at : false;
  const unreadMessage = letter
    ? isLinkUnclaimed
      ? "아직 확인하지 않았어요"
      : unread
        ? "아직 친구가 읽지 않았어요"
        : null
    : null;

  return (
    <main className="flex h-[100dvh] flex-col bg-[var(--color-bg-content)]">
      <DetailHeader />

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-8">
        <div className="w-full -translate-y-5">
          {letter ? (
            <SentLetterCard
              receiverLabel={receiverLabel}
              content={letter.content}
            />
          ) : isPending ? (
            <LetterDetailSkeleton />
          ) : null}

          {letter ? (
            <div className="mt-6 flex items-start justify-between gap-3">
              <div className="min-w-0">
                {unreadMessage ? (
                  <p className="text-[14px] font-medium text-[#929292]">
                    {unreadMessage}
                  </p>
                ) : letter.reaction ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#191F28] px-3 py-2 text-[14px] font-semibold text-white">
                    <span className="text-[19px] leading-none">
                      {letter.reaction}
                    </span>
                    <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
                  </span>
                ) : null}
              </div>

              <p className="shrink-0 pt-1 text-[12px] font-medium text-[#787878]">
                {formatLetterDate(letter.created_at)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
