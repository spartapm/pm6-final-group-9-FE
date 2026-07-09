"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { toast } from "@/components/common/Toast";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { TabBar } from "@/components/ui/TabBar";
import { redirectToOnboarding } from "@/lib/auth-redirect";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("received");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState("");

  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "sent") {
      setTab("sent");
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/home";

    try {
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
          return;
        }
      }

      const res = await apiFetch<{ data: Profile }>("/profiles/me");
      setProfile(res.data);
      setStatusDraft(res.data.status_message ?? "");
      track("my_home_view", { user_id: res.data.id });
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        redirectToOnboarding(router, "DIRECT", returnUrl);
      } else {
        setError("홈 정보를 불러오지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const supabase = createClient();
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setLoading(true);
        loadProfile();
      }
      if (event === "SIGNED_OUT") {
        setProfile(null);
        redirectToOnboarding(router, "DIRECT", "/home");
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, router]);

  useEffect(() => {
    if (!profile) return;
    setLetters([]);
    setCursor(null);
    setHasMore(false);
    (async () => {
      setListLoading(true);
      try {
        const path =
          tab === "received" ? "/letters/received" : "/letters/sent";
        const res = await apiFetch<{
          data: { items: Letter[]; nextCursor: string | null };
        }>(`${path}?limit=20`);
        setLetters(res.data.items);
        setCursor(res.data.nextCursor);
        setHasMore(Boolean(res.data.nextCursor));
        if (tab === "received") {
          setHasUnread(res.data.items.some((l) => !l.read_at));
        }
      } catch {
        toast("쪽지를 불러오지 못했어요. 다시 시도해주세요");
      } finally {
        setListLoading(false);
      }
    })();
  }, [profile, tab]);

  async function loadMore() {
    if (!cursor || listLoading) return;
    setListLoading(true);
    try {
      const path = tab === "received" ? "/letters/received" : "/letters/sent";
      const res = await apiFetch<{
        data: { items: Letter[]; nextCursor: string | null };
      }>(`${path}?cursor=${cursor}&limit=20`);
      setLetters((prev) => [...prev, ...res.data.items]);
      setCursor(res.data.nextCursor);
      setHasMore(Boolean(res.data.nextCursor));
    } catch {
      toast("쪽지를 불러오지 못했어요. 다시 시도해주세요");
    } finally {
      setListLoading(false);
    }
  }

  async function copyHomeLink() {
    if (!profile) return;
    track("home_link_copy_click", { user_id: profile.id });
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/u/${profile.home_slug}`;
    toast("링크를 복사하고있어요", { variant: "loading" });
    try {
      await navigator.clipboard.writeText(url);
      toast("링크가 복사되었습니다", { variant: "success" });
      track("home_link_copy_success", { user_id: profile.id });
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
      setProfile({ ...profile, ...res.data });
      setEditingStatus(false);
    } catch {
      toast("저장하지 못했어요. 다시 시도해주세요.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-secondary)]">
        불러오는 중…
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={error}
        onRetry={() => {
          setLoading(true);
          loadProfile();
        }}
      />
    );
  }

  if (!profile) {
    return null;
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
            height={17}
            className={`mt-0.5 h-[17px] w-[17px] shrink-0 ${
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
            height={17}
            className="mt-0.5 h-[17px] w-[17px] shrink-0"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-black">
              <span className="font-bold">{senderName}</span>
              <span className="font-medium">님이 쪽지를 보냈어요</span>
            </p>
            <p className="mt-2 text-[14px] leading-[1.45] text-black">
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

  return (
    <main
      className={`flex min-h-screen flex-col bg-white ${mainTabPaddingClass}`}
    >
      <AppHeader centered settingsHref="/settings" />

      <div className="mx-6 mb-4 flex flex-1 flex-col overflow-hidden rounded-[10px] border border-black">
        <section className="px-5 pb-4 pt-5">
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
                  placeholder="요즘 어떻게 지내시나요?"
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
                      요즘 어떻게 지내시나요?
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
                aria-label={editingStatus ? "상태메시지 저장" : "상태메시지 수정"}
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

        <section className="relative flex flex-1 flex-col bg-[var(--color-bg-content)] px-5 pb-14 pt-4">
          <p className="mb-3 text-[12px] text-[var(--color-text-muted)]">
            {tab === "received"
              ? "받은 쪽지는 나만 볼 수 있어요"
              : "보낸 쪽지는 나만 볼 수 있어요"}
          </p>

          {letters.length === 0 && !listLoading ? (
            <EmptyState
              title={
                tab === "received"
                  ? "아직 받은 쪽지가 없어요"
                  : "아직 보낸 쪽지가 없어요"
              }
              description={
                tab === "received"
                  ? "내 쪽지함 링크를 공유해 보세요."
                  : "하단 ‘쪽지 보내기’에서 쪽지를내보세요."
              }
              imageSrc="/images/empty-inbox.png"
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

          {hasMore ? (
            <button
              type="button"
              disabled={listLoading}
              onClick={loadMore}
              className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-white py-3 text-sm text-[var(--color-text-secondary)]"
            >
              {listLoading ? "불러오는 중…" : "더 보기"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={copyHomeLink}
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
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
