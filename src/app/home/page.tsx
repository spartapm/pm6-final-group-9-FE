"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { toast } from "@/components/common/Toast";
import {
  LetterCardSkeleton,
  ProfileHeaderSkeleton,
} from "@/components/common/ContentSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { TabBar } from "@/components/ui/TabBar";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import {
  flattenLetters,
  queryKeys,
  useLetters,
  useMyProfile,
} from "@/lib/queries";
import type { Letter, Profile } from "@/types";
import { REACTION_LABELS } from "@/types";

type Tab = "received" | "sent";

const STATUS_MESSAGE_MAX = 18;

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

function isSentLetterUnread(letter: Letter) {
  return !letter.read_at;
}

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("received");
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const {
    data: profile,
    error: profileError,
    refetch: refetchProfile,
    isPending: profilePending,
  } = useMyProfile(authChecked);

  const {
    data: lettersData,
    error: lettersError,
    refetch: refetchLetters,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending: lettersPending,
  } = useLetters(tab, authChecked && Boolean(profile));

  const letters = flattenLetters(lettersData);
  const hasUnread =
    tab === "received" && letters.some((letter) => !letter.read_at);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "sent") {
      setTab("sent");
    }
  }, []);

  const verifySession = useCallback(async () => {
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/home";

    const sessionRes = await fetch("/api/auth/token", {
      credentials: "include",
    });

    if (!sessionRes.ok) {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        redirectToOnboarding(router, "DIRECT", returnUrl);
        return false;
      }
    }
    return true;
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await verifySession();
      if (!cancelled && ok) {
        setAuthChecked(true);
      }
    })();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        queryClient.invalidateQueries({ queryKey: ["letters"] });
      }
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        redirectToOnboarding(router, "DIRECT", "/home");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [queryClient, router, verifySession]);

  useEffect(() => {
    if (profile) {
      setStatusDraft(profile.status_message ?? "");
      track("my_home_view", { user_id: profile.id });
    }
  }, [profile]);

  useEffect(() => {
    if (profileError instanceof ApiError && profileError.status === 401) {
      verifySession().then((ok) => {
        if (!ok) return;
        refetchProfile();
      });
    }
  }, [profileError, refetchProfile, verifySession]);

  useEffect(() => {
    if (isFetchNextPageError) {
      toast("쪽지를 불러오지 못했어요. 다시 시도해주세요");
    }
  }, [isFetchNextPageError]);

  async function copyHomeLink(currentProfile: Profile) {
    track("home_link_copy_click", { user_id: currentProfile.id });
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/u/${currentProfile.home_slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("링크가 복사되었습니다", { variant: "success" });
      track("home_link_copy_success", { user_id: currentProfile.id });
    } catch {
      toast("링크 복사에 실패했어요. 다시 시도해주세요.", { variant: "error" });
    }
  }

  async function saveStatus() {
    if (!profile) return;
    try {
      const value = statusDraft.trim();
      const res = await apiFetch<{ data: Profile }>("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          status_message: value === "" ? null : value,
        }),
      });
      queryClient.setQueryData(queryKeys.profile, res.data);
      setEditingStatus(false);
    } catch {
      toast("저장하지 못했어요. 다시 시도해주세요.");
    }
  }

  const showProfileError =
    profileError &&
    !(profileError instanceof ApiError && profileError.status === 401) &&
    !profile;

  if (showProfileError) {
    return (
      <ErrorState
        title="홈 정보를 불러오지 못했어요. 다시 시도해주세요."
        onRetry={() => refetchProfile()}
      />
    );
  }

  const truncate = (text: string, n = 48) =>
    text.length > n ? `${text.slice(0, n)}…` : text;

  function renderSentCard(letter: Letter) {
    const unread = isSentLetterUnread(letter);
    const recipientName = letter.receiver_nickname ?? "친구";

    return (
      <Link
        href={`/letters/sent/${letter.id}`}
        className="block rounded-[10px] bg-white px-4 py-4 transition active:scale-[0.99]"
      >
        <div className="flex gap-2.5">
          <Image
            src="/images/icon-letter.png"
            alt=""
            width={17}
            height={24}
            className={`mt-0.5 h-[24px] w-[17px] shrink-0 ${
              unread ? "opacity-30" : "opacity-100"
            }`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-[14px] ${
                unread
                  ? "font-medium text-[#929292]"
                  : "text-black"
              }`}
            >
              {unread ? (
                "아직 친구가 읽지 않았어요"
              ) : (
                <>
                  <span className="font-bold">{recipientName}</span>
                  <span className="font-medium">에게</span>
                </>
              )}
            </p>
            <p
              className={`mt-2 text-[14px] leading-[1.45] ${
                unread ? "text-[#C5C5C5]" : "text-black"
              }`}
            >
              {truncate(letter.content)}
            </p>
            {letter.reaction && !unread ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#474747] px-2.5 py-1 text-[12px] font-medium text-white">
                <span>{letter.reaction}</span>
                <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
              </span>
            ) : null}
            <p className="mt-3 text-right text-[12px] text-[#C5C5C5]">
              {formatLetterDate(letter.created_at)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  function renderReceivedCard(letter: Letter) {
    const senderName = letter.is_anonymous ? "익명" : letter.sender_nickname;
    const read = Boolean(letter.read_at);

    return (
      <Link
        href={`/letters/received/${letter.id}`}
        className="block rounded-[10px] bg-white px-4 py-4 transition active:scale-[0.99]"
      >
        <div className="flex gap-2.5">
          <Image
            src="/images/icon-letter.png"
            alt=""
            width={17}
            height={24}
            className={`mt-0.5 h-[24px] w-[17px] shrink-0 ${
              read ? "opacity-30" : "opacity-100"
            }`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className={`text-[14px] ${read ? "text-[#929292]" : "text-black"}`}>
              <span className="font-bold">{senderName}</span>
              <span className="font-medium">님이 쪽지를 보냈어요</span>
            </p>
            <p
              className={`mt-2 text-[14px] leading-[1.45] ${
                read ? "text-[#C5C5C5]" : "text-black"
              }`}
            >
              {truncate(letter.content)}
            </p>
            {letter.reaction ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#474747] px-2.5 py-1 text-[12px] font-medium text-white">
                <span>{letter.reaction}</span>
                <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
              </span>
            ) : null}
            <p className="mt-3 text-right text-[12px] text-[#C5C5C5]">
              {formatLetterDate(letter.created_at)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  const atStatusLimit =
    editingStatus && statusDraft.length >= STATUS_MESSAGE_MAX;
  const showLetterSkeletons =
    profile && lettersPending && letters.length === 0;
  const showListError =
    profile && Boolean(lettersError) && letters.length === 0 && !lettersPending;

  return (
    <main
      className={`flex h-[100dvh] flex-col bg-white ${mainTabPaddingClass}`}
    >
      <AppHeader centered settingsHref="/settings" />

      <div className="mx-6 mb-4 flex flex-1 flex-col overflow-hidden rounded-[10px] border border-black">
        <section className="px-5 pb-4 pt-5">
          {profile ? (
            <>
              <h1 className="text-center text-[18px] tracking-[-0.5px] text-[var(--color-text-secondary)]">
                <span className="font-semibold text-black">{profile.nickname}</span>
                의 쪽지함
              </h1>

              <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-[var(--color-text-placeholder)]">
                <span>보낸 횟수 {profile.sent_count ?? 0}</span>
                <span className="text-[var(--color-border)]">|</span>
                <span>받은 횟수 {profile.received_count ?? 0}</span>
              </div>

              <div>
                <div
                  className={`relative mt-4 flex items-center rounded-full border bg-[var(--color-surface-muted)] px-4 py-2.5 ${
                    atStatusLimit
                      ? "border-[#E53935]"
                      : "border-[var(--color-border-light)]"
                  }`}
                >
                  {editingStatus ? (
                    <input
                      value={statusDraft}
                      maxLength={STATUS_MESSAGE_MAX}
                      onChange={(e) => setStatusDraft(e.target.value)}
                      placeholder="상태메시지를 작성해주세요"
                      className="w-full bg-transparent pr-8 text-[13px] text-[var(--color-text-secondary)] outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveStatus();
                      }}
                    />
                  ) : (
                    <p className="flex-1 pr-8 text-center text-[13px] text-[var(--color-text-secondary)]">
                      {profile.status_message || (
                        <span className="text-[var(--color-text-muted)]">
                          상태메시지를 작성해주세요
                        </span>
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (editingStatus) {
                        saveStatus();
                        return;
                      }
                      track("status_edit_click", { user_id: profile.id });
                      setStatusDraft(profile.status_message ?? "");
                      setEditingStatus(true);
                    }}
                    className="absolute right-4 shrink-0"
                    aria-label={
                      editingStatus ? "상태메시지 저장" : "상태메시지 수정"
                    }
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M9.5 2.5 11.5 4.5M2 12l.5-3.5L9.5 2l3 3L5.5 11.5 2 12Z"
                        stroke="#9A9A9A"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {atStatusLimit ? (
                  <p className="mt-2 text-center text-[12px] font-medium text-[#E53935]">
                    최대 18자까지만 작성이 가능해요
                  </p>
                ) : null}
              </div>
            </>
          ) : profilePending ? (
            <ProfileHeaderSkeleton />
          ) : null}
        </section>

        <TabBar
          tabs={[
            {
              id: "received",
              label: "받은 쪽지",
              badge: hasUnread ? "new" : undefined,
            },
            { id: "sent", label: "보낸 쪽지" },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as Tab)}
        />

        <section className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg-content)] px-5 pb-14 pt-4">
          <p className="mb-3 text-[12px] text-[var(--color-text-muted)]">
            {tab === "received"
              ? "받은 쪽지는 나만 볼 수 있어요"
              : "보낸 쪽지는 나만 볼 수 있어요"}
          </p>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {showLetterSkeletons ? (
              <ul className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <li key={i}>
                    <LetterCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : showListError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  쪽지를 불러오지 못했어요. 다시 시도해주세요
                </p>
                <button
                  type="button"
                  onClick={() => refetchLetters()}
                  className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  다시 시도
                </button>
              </div>
            ) : profile && letters.length === 0 && !lettersPending ? (
              <EmptyState
                title={
                  tab === "received"
                    ? "아직 받은 쪽지가 없어요."
                    : "아직 보낸 쪽지가 없어요."
                }
                description={
                  tab === "received"
                    ? "내 쪽지함을 공유해 보세요!"
                    : "소중한 마음을 보내보세요!"
                }
                imageSrc="/images/empty-letter.png"
              />
            ) : (
              <ul className="space-y-3">
                {letters.map((letter) => (
                  <li key={letter.id}>
                    {tab === "received"
                      ? renderReceivedCard(letter)
                      : renderSentCard(letter)}
                  </li>
                ))}
              </ul>
            )}

            {hasNextPage ? (
              <button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-white py-3 text-sm text-[var(--color-text-secondary)] disabled:opacity-60"
              >
                {isFetchingNextPage ? "불러오는 중…" : "더 보기"}
              </button>
            ) : null}
          </div>

          {profile ? (
            <button
              type="button"
              onClick={() => copyHomeLink(profile)}
              className="absolute bottom-0 left-0 right-0 flex h-10 items-center justify-center gap-2 rounded-b-[10px] bg-[var(--color-primary)] text-[16px] text-white"
            >
              내 쪽지함 공유하기
              <Image
                src="/images/icon-share.png"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4"
                aria-hidden
              />
            </button>
          ) : null}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
