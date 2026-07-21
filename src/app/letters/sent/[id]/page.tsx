"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LetterDetailSkeleton } from "@/components/common/ContentSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { toast } from "@/components/common/Toast";
import { LetterPaperCard } from "@/components/letter/LetterPaperCard";
import { FigmaImage } from "@/components/ui/FigmaImage";
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

function DetailHeader() {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center bg-[var(--color-bg-content)] px-3 pt-[env(safe-area-inset-top)]">
      <Link
        href="/home?tab=sent"
        className="flex h-10 w-10 items-center justify-center"
        aria-label="뒤로"
      >
        <FigmaImage
          src="/images/figma/icon-back-ios.svg"
          alt=""
          width={24}
          height={24}
          className="h-6 w-6"
        />
      </Link>
    </header>
  );
}

export default function SentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: letter, error, refetch, isPending } = useSentLetter(params.id);
  const [copying, setCopying] = useState(false);

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

  async function copyLetterLink() {
    if (!letter?.shareUrl || copying) return;
    setCopying(true);
    toast("링크를 복사하고 있어요", { variant: "loading" });
    try {
      await navigator.clipboard.writeText(letter.shareUrl);
      toast("링크가 복사되었습니다", { variant: "success" });
    } catch {
      toast("링크 복사에 실패했어요. 다시 시도해주세요.", { variant: "error" });
    } finally {
      setCopying(false);
    }
  }

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
  const showCopyLink = Boolean(letter);

  return (
    <main className="flex h-[100dvh] flex-col bg-[var(--color-bg-content)]">
      <DetailHeader />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="my-auto w-full">
          {letter ? (
            <LetterPaperCard
              toLabel={receiverLabel}
              fromLabel={letter.sender_nickname}
              content={letter.content}
              footer={`${formatLetterDate(letter.created_at)} 보냄`}
            />
          ) : isPending ? (
            <LetterDetailSkeleton />
          ) : null}

          {letter ? (
            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {unreadMessage ? (
                  <p className="text-[14px] font-medium text-[var(--color-text-muted)]">
                    {unreadMessage}
                  </p>
                ) : letter.reaction ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#2A2A2A] px-[11px] py-[9px] text-[14px] font-semibold text-white">
                    <span className="text-[19px] leading-none">
                      {letter.reaction}
                    </span>
                    <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
                  </span>
                ) : (
                  <span />
                )}
              </div>

              {showCopyLink ? (
                <button
                  type="button"
                  disabled={copying || !letter.shareUrl}
                  onClick={() => void copyLetterLink()}
                  className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[#787878] disabled:opacity-50"
                >
                  쪽지 링크 복사
                  <FigmaImage
                    src="/images/figma/icon-link-copy.svg"
                    alt=""
                    width={13}
                    height={13}
                    className="h-[13px] w-[13px]"
                  />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
