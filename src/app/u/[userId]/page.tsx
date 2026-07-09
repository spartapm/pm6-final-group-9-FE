"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { apiFetch, ApiError } from "@/lib/api-client";
import { ErrorState } from "@/components/common/ErrorState";
import { track } from "@/lib/analytics";
import type { Profile } from "@/types";

function FriendHomeHeader() {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-center bg-white px-5">
      <Link
        href="/home"
        className="absolute left-5 flex h-9 w-9 items-center justify-center text-[#474747]"
        aria-label="홈으로"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path
            d="M4 10.5 11 4l7 6.5V18a1 1 0 0 1-1 1h-4.5v-5H9.5V19H5a1 1 0 0 1-1-1v-7.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 11.5 11 9l3 2.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <Link
        href="/home"
        className="logo-gugu-letter-sm text-[18px] text-[var(--color-header-logo)]"
      >
        GUGU LETTER
      </Link>
    </header>
  );
}

export default function PublicHomePage() {
  const params = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicPath = `/u/${params.userId}`;

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<{ data: Profile }>(
          `/profiles/${params.userId}`,
          { auth: false }
        );
        setProfile(res.data);
        track("status_message_view_visitor", {
          owner_id: res.data.id,
          has_message: Boolean(res.data.status_message),
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setError("존재하지 않는 홈이에요.");
        } else {
          setError("홈 정보를 불러오지 못했어요.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-text-secondary)]">
        불러오는 중…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <ErrorState
        title={error ?? "존재하지 않는 홈이에요."}
        homeHref="/login"
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)] pb-8">
      <FriendHomeHeader />

      <section className="bg-white px-6 pb-5 pt-4">
        <h1 className="text-center text-[18px] tracking-[-0.5px] text-[var(--color-text-secondary)]">
          <span className="font-semibold text-black">{profile.nickname}</span>
          의 쪽지함
        </h1>

        {profile.status_message ? (
          <p className="mt-4 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-2.5 text-center text-[13px] leading-snug text-[var(--color-text-secondary)]">
            {profile.status_message}
          </p>
        ) : null}
      </section>

      <WriteLetterForm
        receiverId={profile.id}
        receiverNickname={profile.nickname}
        entryPath="receiver_home"
        returnUrl={publicPath}
        completeBackPath={publicPath}
        showTitle={false}
        submitLabel="친구에게 쪽지 써주기"
        showSubmitIcon
      />
    </main>
  );
}
