"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toPng } from "html-to-image";
import { LetterDetailSkeleton } from "@/components/common/ContentSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toast } from "@/components/common/Toast";
import { track } from "@/lib/analytics";
import { useReceivedLetter, queryKeys } from "@/lib/queries";
import { ShareableLetterCard, preloadShareAssets, SHARE_CARD_CAPTURE_OPTIONS } from "@/components/letter/ShareableLetterCard";
import { REACTION_LABELS, REACTION_OPTIONS, type Letter } from "@/types";

type ReceivedListCache = {
  pages: { items: Letter[]; nextCursor: string | null }[];
  pageParams: unknown[];
};

function formatReceivedDate(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} ${time}`;
}

function ConfirmModal({
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
      <div className="mx-auto w-[80%] max-w-[300px] rounded-[20px] bg-white p-6 text-center">
        <p className="text-base font-bold text-black">{title}</p>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[#787878]">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#D4D4D4] py-3 text-sm font-medium"
          >
            아니요
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#474747] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            예
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceivedLetterCard({
  senderLabel,
  content,
}: {
  senderLabel: string;
  content: string;
}) {
  return (
    <article className="w-full rounded-[16px] border border-black bg-white px-6 py-5">
      <p className="text-[18px] font-semibold text-[#1F1F1F]">
        From. {senderLabel}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-[14px] leading-[1.5] tracking-[-0.32px] text-[#191F28]">
        {content}
      </p>
    </article>
  );
}

export default function ReceivedDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const shareRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const {
    data: letter,
    error: queryError,
    refetch,
    isPending,
  } = useReceivedLetter(params.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionOpen, setReactionOpen] = useState(false);

  useEffect(() => {
    if (letter) {
      setReaction(letter.reaction ?? null);
    }
  }, [letter]);

  useEffect(() => {
    if (!letter?.id || !letter.read_at) return;
    const readAt = letter.read_at;
    queryClient.setQueryData<ReceivedListCache>(
      queryKeys.letters("received"),
      (prev) => {
        if (!prev) return prev;
        let changed = false;
        const pages = prev.pages.map((page) => {
          const items = page.items.map((item) => {
            if (item.id === letter.id && !item.read_at) {
              changed = true;
              return { ...item, read_at: readAt };
            }
            return item;
          });
          return items === page.items ? page : { ...page, items };
        });
        return changed ? { ...prev, pages } : prev;
      }
    );
  }, [letter?.id, letter?.read_at, queryClient]);

  useEffect(() => {
    if (queryError instanceof ApiError && queryError.status === 401) {
      redirectToOnboarding(
        router,
        "MESSAGE_READ",
        `/letters/received/${params.id}`
      );
    }
  }, [queryError, params.id, router]);

  const error =
    queryError instanceof ApiError && queryError.status === 403
      ? "접근 할 수 없는 화면이에요"
      : queryError instanceof ApiError && queryError.status === 404
        ? "존재하지 않는 쪽지예요"
        : queryError
          ? "쪽지를 불러오지 못했어요. 다시 시도해주세요"
          : null;

  async function onReaction(emoji: string) {
    try {
      const res = await apiFetch<{ data: { emoji: string | null } }>(
        `/letters/${params.id}/reaction`,
        {
          method: "PUT",
          body: JSON.stringify({ emoji }),
        }
      );
      setReaction(res.data.emoji);
      setReactionOpen(false);
      queryClient.setQueryData(
        queryKeys.letterReceived(params.id),
        (prev: typeof letter) =>
          prev ? { ...prev, reaction: res.data.emoji } : prev
      );
    } catch {
      toast("이모지 등록에 실패했어요. 다시 시도해주세요.");
    }
  }

  async function onReport() {
    try {
      await apiFetch(`/letters/${params.id}/report`, { method: "POST" });
      setReportOpen(false);
      toast("신고가 완료되었어요.");
      router.replace("/home");
    } catch {
      toast("신고에 실패했어요. 다시 시도해주세요.");
    }
  }

  async function openSharePreview() {
    if (!letter || !shareRef.current || generating) return;
    setGenerating(true);
    track("share_card_image_icon_click", {
      letter_id: letter.id,
      receiver_id: letter.receiver_id,
      sender_id: letter.sender_id,
    });
    try {
      track("share_card_generate_start", {
        letter_id: letter.id,
        card_template_id: "default_card",
      });
      await preloadShareAssets();
      const dataUrl = await toPng(shareRef.current, SHARE_CARD_CAPTURE_OPTIONS);
      setPreviewUrl(dataUrl);
      track("share_card_preview_view", {
        letter_id: letter.id,
        card_template_id: "default_card",
      });
    } catch {
      toast("공유 이미지를 만들지 못했어요. 다시 시도해주세요.");
      track("share_card_external_share_fail", {
        letter_id: letter.id,
        error_code: "generate_fail",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function dataUrlToFile(dataUrl: string) {
    const blob = await (await fetch(dataUrl)).blob();
    return new File([blob], "guguletter.png", { type: "image/png" });
  }

  function saveImage(dataUrl: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "guguletter.png";
    a.click();
    toast("이미지를 저장했어요.");
    if (letter) track("share_card_save_complete", { letter_id: letter.id });
  }

  async function shareImage() {
    if (!letter || !previewUrl || sharing) return;
    setSharing(true);
    try {
      const file = await dataUrlToFile(previewUrl);
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "구구레터",
          text: "소중한 쪽지를 공유해요",
        });
        track("share_card_external_share_sheet_open", {
          letter_id: letter.id,
        });
      } else {
        saveImage(previewUrl);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      toast("공유 화면을 열지 못했어요. 다시 시도해주세요.");
      track("share_card_external_share_fail", {
        letter_id: letter.id,
        error_code: "share_fail",
      });
    } finally {
      setSharing(false);
    }
  }

  const senderLabel = letter
    ? letter.is_anonymous
      ? "익명"
      : letter.sender_nickname
    : "";
  const activeReaction = letter
    ? (reaction ?? letter.reaction ?? null)
    : null;

  return (
    <main className="flex h-[100dvh] flex-col bg-[var(--color-bg-content)]">
      <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center bg-[var(--color-bg-content)] px-3 pt-[env(safe-area-inset-top)]">
        <Link
          href="/home"
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

        {letter ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center text-[#474747]"
              aria-label="더보기"
            >
              <svg width="5" height="19" viewBox="0 0 5 19" fill="currentColor" aria-hidden>
                <circle cx="2.5" cy="2.5" r="2.5" />
                <circle cx="2.5" cy="9.5" r="2.5" />
                <circle cx="2.5" cy="16.5" r="2.5" />
              </svg>
            </button>

            {menuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-label="메뉴 닫기"
                  onClick={() => setMenuOpen(false)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="absolute right-0 z-20 mt-1 flex h-[38px] w-[100px] items-center justify-center rounded-[10px] bg-[#242429] text-[14px] text-white"
                >
                  신고하기
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </header>

      {error && !letter ? (
        <ErrorState title={error} onRetry={() => refetch()} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-8">
          <div className="w-full -translate-y-5">
            {letter ? (
              <ReceivedLetterCard
                senderLabel={senderLabel}
                content={letter.content}
              />
            ) : isPending ? (
              <LetterDetailSkeleton />
            ) : null}

            {letter ? (
              <div className="mt-6">
          {reactionOpen ? (
            <section className="rounded-[17px] bg-[rgba(232,232,232,0.76)] px-4 pb-5 pt-4">
              <div className="flex items-start gap-2">
                <Image
                  src="/images/icon-face-add.svg"
                  alt=""
                  width={19}
                  height={19}
                  className="mt-0.5 h-[19px] w-[19px]"
                  aria-hidden
                />
                <div>
                  <p className="text-[12px] font-medium tracking-[-0.24px] text-black">
                    감정 이모지로 답장하기
                  </p>
                  <p className="mt-1 text-[10px] font-medium tracking-[-0.2px] text-[#6B6B6B]">
                    1개만 선택해주세요! 이모지는 다시 고를 수 있어요.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {REACTION_OPTIONS.map((item) => {
                  const selected = activeReaction === item.emoji;
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => onReaction(item.emoji)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-semibold transition active:scale-[0.98] ${
                        selected
                          ? "bg-[#2A2A2A] text-white"
                          : "border border-[#C5C5C5] bg-[rgba(255,255,255,0.8)] text-[#1F1F1F]"
                      }`}
                    >
                      <span className="text-[19px] leading-none">{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <div className="flex items-start justify-between gap-3">
              {activeReaction ? (
                <button
                  type="button"
                  onClick={() => setReactionOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#191F28] px-3 py-2 text-[14px] font-semibold text-white"
                >
                  <span className="text-[19px] leading-none">{activeReaction}</span>
                  <span>{REACTION_LABELS[activeReaction] ?? ""}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setReactionOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#2C2C2C] px-4 py-2"
                >
                  <Image
                    src="/images/icon-face-add.svg"
                    alt=""
                    width={19}
                    height={19}
                    className="h-[19px] w-[19px] invert"
                    aria-hidden
                  />
                  <span className="text-[12px] font-medium tracking-[-0.24px] text-white">
                    감정 이모지로 답장하기
                  </span>
                </button>
              )}

              <div className="flex shrink-0 items-center gap-2 pt-1">
                <p className="text-[12px] font-medium text-[#787878]">
                  {formatReceivedDate(letter.created_at)}
                </p>
                <button
                  type="button"
                  disabled={generating}
                  onClick={openSharePreview}
                  className="flex h-8 w-8 items-center justify-center disabled:opacity-50"
                  aria-label="이미지로 공유하기"
                >
                  {generating ? (
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-[#C5C5C5] border-t-[#474747]"
                      aria-hidden
                    />
                  ) : (
                    <Image
                      src="/images/icon-share-external.svg"
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px]"
                      aria-hidden
                    />
                  )}
                </button>
              </div>
            </div>
          )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {reportOpen && letter ? (
        <ConfirmModal
          title="신고하기"
          description="정말 신고하시겠습니까?"
          onCancel={() => setReportOpen(false)}
          onConfirm={onReport}
        />
      ) : null}

      {previewUrl ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 px-6 py-8">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="미리보기 닫기"
            onClick={() => setPreviewUrl(null)}
          />
          <div className="relative z-10 flex w-full max-w-[320px] flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="공유 이미지 미리보기"
              className="max-h-[60vh] w-full rounded-[16px] object-contain shadow-lg"
            />
            <div className="mt-5 flex w-full gap-2">
              <button
                type="button"
                onClick={() => saveImage(previewUrl)}
                className="flex-1 rounded-xl border border-white/70 bg-white/10 py-3 text-sm font-semibold text-white"
              >
                이미지 저장
              </button>
              <button
                type="button"
                disabled={sharing}
                onClick={shareImage}
                className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-[#242429] disabled:opacity-70"
              >
                {sharing ? "공유 중…" : "공유하기"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="mt-3 text-sm font-medium text-white/80"
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}

      {letter ? (
        <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
          <ShareableLetterCard
            ref={shareRef}
            senderLabel={senderLabel}
            content={letter.content}
          />
        </div>
      ) : null}
    </main>
  );
}
