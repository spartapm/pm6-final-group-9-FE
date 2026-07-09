"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { apiFetch, ApiError } from "@/lib/api-client";
import { REACTION_LABELS, type Letter } from "@/types";

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

export default function SentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [letter, setLetter] = useState<
    (Letter & { reaction: string | null; is_opened: boolean }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{
          data: Letter & { reaction: string | null; is_opened: boolean };
        }>(`/letters/sent/${params.id}`);
        setLetter(res.data);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          redirectToOnboarding(
            router,
            "DIRECT",
            `/letters/sent/${params.id}`
          );
          return;
        }
        setError("쪽지를 불러오지 못했어요. 다시 시도해주세요");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-content)] text-sm text-[var(--color-text-secondary)]">
        불러오는 중…
      </div>
    );
  }

  if (error || !letter) {
    return (
      <ErrorState
        title={error ?? "쪽지를 찾을 수 없어요."}
        onRetry={() => router.refresh()}
      />
    );
  }

  const senderLabel = letter.is_anonymous ? "익명" : letter.sender_nickname;
  const isLinkUnclaimed =
    letter.delivery_type === "link" && !letter.receiver_id;
  const unread = !letter.read_at;
  const unreadMessage = isLinkUnclaimed
    ? "아직 확인하지 않았어요"
    : unread
      ? "아직 친구가 읽지 않았어요"
      : null;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
      <header className="relative flex h-14 shrink-0 items-center px-3">
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

      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-8">
        <div className="w-full -translate-y-5">
          <SentLetterCard senderLabel={senderLabel} content={letter.content} />

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
        </div>
      </div>
    </main>
  );
}
