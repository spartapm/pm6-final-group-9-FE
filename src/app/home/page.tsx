"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { GuideTooltip } from "@/components/common/GuideTooltip";
import { StatusSpeechBubble } from "@/components/common/StatusSpeechBubble";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { FigmaImage } from "@/components/ui/FigmaImage";
import { TabBar } from "@/components/ui/TabBar";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { useLettersRealtime } from "@/hooks/useLettersRealtime";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  flattenLetters,
  queryKeys,
  useLetters,
  useMyProfile,
} from "@/lib/queries";
import type { Letter, Profile } from "@/types";
import { REACTION_LABELS } from "@/types";

const SHARE_TIP_KEY = "guguletter-share-tip-count";
const SHARE_TIP_MAX = 3;

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
  const [statusSaving, setStatusSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showShareTip, setShowShareTip] = useState(false);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const savedStatusRef = useRef<string | null>(null);

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

  useLettersRealtime(profile?.id, authChecked && Boolean(profile));

  const onPullRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchLetters()]);
  }, [refetchLetters, refetchProfile]);

  const { refreshing, distance, indicatorStyle } = usePullToRefresh({
    onRefresh: onPullRefresh,
    disabled: !authChecked,
  });

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
      if (!editingStatus) {
        setStatusDraft(profile.status_message ?? "");
        savedStatusRef.current = profile.status_message ?? "";
      }
      track("my_home_view", { user_id: profile.id });

      // 상태메시지 미설정 시 공유 안내 팝오버 (최대 3회)
      if (!profile.status_message) {
        try {
          const count = Number(localStorage.getItem(SHARE_TIP_KEY) ?? "0");
          if (count < SHARE_TIP_MAX) {
            setShowShareTip(true);
          }
        } catch {
          setShowShareTip(true);
        }
      }
    }
  }, [profile, editingStatus]);

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
      dismissShareTip();
    } catch {
      toast("링크 복사에 실패했어요. 다시 시도해주세요.", { variant: "error" });
    }
  }

  function dismissShareTip() {
    setShowShareTip(false);
    try {
      const count = Number(localStorage.getItem(SHARE_TIP_KEY) ?? "0");
      localStorage.setItem(SHARE_TIP_KEY, String(Math.min(count + 1, SHARE_TIP_MAX)));
    } catch {
      /* ignore */
    }
  }

  async function saveStatus() {
    if (!profile || statusSaving) return;
    const value = statusDraft.trim();
    const prev = (savedStatusRef.current ?? "").trim();
    if (value === prev) {
      setEditingStatus(false);
      setStatusDraft(profile.status_message ?? "");
      return;
    }

    setStatusSaving(true);
    try {
      const res = await apiFetch<{ data: Profile }>("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          status_message: value === "" ? null : value,
        }),
      });
      // count 포함 응답 — 기존 캐시와 merge로 쪽지 수 유지 보장
      queryClient.setQueryData(queryKeys.profile, (old: Profile | undefined) => ({
        ...old,
        ...res.data,
        received_count: res.data.received_count ?? old?.received_count ?? 0,
        sent_count: res.data.sent_count ?? old?.sent_count ?? 0,
      }));
      savedStatusRef.current = value;
      setEditingStatus(false);
    } catch {
      toast("저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setStatusSaving(false);
    }
  }

  function startEditStatus() {
    if (!profile) return;
    track("status_edit_click", { user_id: profile.id });
    // placeholder만 있을 때는 빈 input으로 진입
    setStatusDraft(profile.status_message ?? "");
    setEditingStatus(true);
    requestAnimationFrame(() => statusInputRef.current?.focus());
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
          <FigmaImage
            src="/images/icon-letter.png"
            alt=""
            width={17}
            height={24}
            className={`mt-0.5 h-[24px] w-[17px] shrink-0 ${
              unread ? "opacity-30" : "opacity-100"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-[14px] ${
                unread
                  ? "font-medium text-[var(--color-text-muted)]"
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
                unread ? "text-[var(--color-text-disabled)]" : "text-black"
              }`}
            >
              {truncate(letter.content)}
            </p>
            {letter.reaction && !unread ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[12px] font-medium text-white">
                <span>{letter.reaction}</span>
                <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
              </span>
            ) : null}
            <p className="mt-3 text-right text-[12px] text-[var(--color-text-disabled)]">
              {formatLetterDate(letter.created_at)} 보냄
            </p>
          </div>
        </div>
      </Link>
    );
  }

  function renderReceivedCard(letter: Letter) {
    const senderName = letter.is_anonymous ? "익명" : letter.sender_nickname;
    const read = Boolean(letter.read_at);
    const title = letter.is_onboarding
      ? "구구님이 쪽지를 보냈어요"
      : null;

    return (
      <Link
        href={`/letters/received/${letter.id}`}
        className="block rounded-[10px] bg-white px-4 py-4 transition active:scale-[0.99]"
      >
        <div className="flex gap-2.5">
          <FigmaImage
            src="/images/icon-letter.png"
            alt=""
            width={17}
            height={24}
            className={`mt-0.5 h-[24px] w-[17px] shrink-0 ${
              read ? "opacity-30" : "opacity-100"
            }`}
          />
          <div className="min-w-0 flex-1">
            <p
              className={`text-[14px] ${
                read ? "text-[var(--color-text-muted)]" : "text-black"
              }`}
            >
              {title ? (
                <span className="font-bold">{title}</span>
              ) : (
                <>
                  <span className="font-bold">{senderName}</span>
                  <span className="font-medium">님이 쪽지를 보냈어요</span>
                </>
              )}
            </p>
            <p
              className={`mt-2 text-[14px] leading-[1.45] ${
                read ? "text-[var(--color-text-disabled)]" : "text-black"
              }`}
            >
              {truncate(letter.content)}
            </p>
            {letter.reaction ? (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[12px] font-medium text-white">
                <span>{letter.reaction}</span>
                <span>{REACTION_LABELS[letter.reaction] ?? ""}</span>
              </span>
            ) : null}
            <p className="mt-3 text-right text-[12px] text-[var(--color-text-disabled)]">
              {formatLetterDate(letter.created_at)} 받음
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
      className={`flex h-[100dvh] flex-col overflow-hidden bg-white ${mainTabPaddingClass}`}
    >
      <div
        className="flex items-center justify-center overflow-hidden text-[12px] text-[#787878] transition-all"
        style={indicatorStyle}
        aria-hidden={!refreshing && distance < 8}
      >
        {refreshing || distance >= 40 ? "새로고침 중…" : distance > 8 ? "당겨서 새로고침" : null}
      </div>

      <AppHeader centered settingsHref="/settings" />

      <div className="flex flex-1 flex-col overflow-hidden">
        <section className="relative px-6 pb-4 pt-2">
          {profile ? (
            <>
              <div className="flex items-center justify-center">
                <h1 className="text-center text-[18px] tracking-[-0.5px] text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-black">
                    {profile.nickname}
                  </span>
                  의 쪽지함
                </h1>
                <div className="relative ml-0.5">
                  <button
                    type="button"
                    onClick={() => copyHomeLink(profile)}
                    className="flex h-8 w-8 items-center justify-center"
                    aria-label="쪽지함 공유하기"
                  >
                    <FigmaImage
                      src="/images/figma/icon-share-home.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                  </button>
                  {showShareTip ? (
                    <div className="absolute left-1/2 top-full z-20 mt-1 w-max -translate-x-[70%]">
                      <GuideTooltip
                        arrow="top"
                        arrowLeft="70%"
                        emoji={null}
                        onClose={dismissShareTip}
                      >
                        내 쪽지함 링크를 공유하고 쪽지를 받아보세요!
                      </GuideTooltip>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-[var(--color-text-placeholder)]">
                <span>받은 횟수 {profile.received_count ?? 0}</span>
                <span className="text-[var(--color-border)]">|</span>
                <span>보낸 횟수 {profile.sent_count ?? 0}</span>
              </div>

              <StatusSpeechBubble
                editing={editingStatus}
                inputRef={statusInputRef}
                value={statusDraft}
                maxLength={STATUS_MESSAGE_MAX}
                placeholder="상태메세지를 입력해주세요"
                disabled={statusSaving}
                error={atStatusLimit}
                onChange={setStatusDraft}
                onSave={() => void saveStatus()}
                onStartEdit={startEditStatus}
              >
                {profile.status_message || (
                  <span className="text-[var(--color-text-placeholder)]">
                    상태메세지를 입력해주세요
                  </span>
                )}
              </StatusSpeechBubble>
              {atStatusLimit ? (
                <p className="mt-2 text-center text-[12px] font-medium text-[#E53935]">
                  18자까지 입력할 수 있어요.
                </p>
              ) : null}
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

        <section className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg-content)] px-5 pb-4 pt-4">
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
                    ? "쪽지함을 공유하고 쪽지를 받아보세요!"
                    : "소중한 마음을 보내보세요!"
                }
                imageSrc="/images/figma/icon-empty-letter.svg"
                imageWidth={110}
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
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
