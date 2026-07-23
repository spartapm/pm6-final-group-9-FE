"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { StatusSpeechBubble } from "@/components/common/StatusSpeechBubble";
import { ProfileHeaderSkeleton } from "@/components/common/ContentSkeleton";
import { ApiError } from "@/lib/api-client";
import { ErrorState } from "@/components/common/ErrorState";
import { FigmaImage } from "@/components/ui/FigmaImage";
import { track } from "@/lib/analytics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePublicProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";

function FriendHomeHeader() {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-center bg-[var(--color-bg-content)] px-5 pt-[env(safe-area-inset-top)]">
      <Link
        href="/home"
        className="absolute left-5 flex h-9 w-9 items-center justify-center"
        aria-label="홈으로"
      >
        <FigmaImage
          src="/images/figma/icon-home-back.svg"
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] object-contain"
        />
      </Link>
      <Link href="/home" aria-label="구구레터 홈" className="inline-flex items-center">
        <FigmaImage
          src="/images/logo-gugu-letter-header.png"
          alt="GUGU LETTER"
          width={160}
          height={17}
          className="h-[17px] w-auto object-contain"
        />
      </Link>
    </header>
  );
}

export default function PublicHomePage() {
  const params = useParams<{ userId: string }>();
  const { data: profile, error, isPending, refetch } = usePublicProfile(
    params.userId
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { refreshing, distance, indicatorStyle } = usePullToRefresh({
    onRefresh: () => refetch(),
  });

  const publicPath = `/u/${params.userId}`;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });
  }, []);

  useEffect(() => {
    if (profile) {
      track("status_message_view_visitor", {
        owner_id: profile.id,
        has_message: Boolean(profile.status_message),
      });
    }
  }, [profile]);

  const errorMessage =
    error instanceof ApiError && error.status === 404
      ? "존재하지 않는 홈이에요."
      : error
        ? "홈 정보를 불러오지 못했어요."
        : null;

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[var(--color-bg-content)] pb-8">
      <div
        className="flex items-center justify-center overflow-hidden text-[12px] text-[var(--color-text-muted)] transition-all"
        style={indicatorStyle}
        aria-hidden={!refreshing && distance < 8}
      >
        {refreshing || distance >= 40
          ? "새로고침 중…"
          : distance > 8
            ? "당겨서 새로고침"
            : null}
      </div>
      <FriendHomeHeader />

      {errorMessage && !profile ? (
        <ErrorState title={errorMessage} homeHref="/login" />
      ) : (
        <>
          <section className="px-6 pb-2 pt-2">
            {profile ? (
              <>
                <h1 className="text-center text-[18px] tracking-[-0.5px] text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-black">
                    {profile.nickname}
                  </span>
                  의 쪽지함
                </h1>

                {profile.status_message ? (
                  <StatusSpeechBubble showEdit={false}>
                    {profile.status_message}
                  </StatusSpeechBubble>
                ) : null}
              </>
            ) : isPending ? (
              <ProfileHeaderSkeleton />
            ) : null}
          </section>

          {profile ? (
            <WriteLetterForm
              receiverId={profile.id}
              receiverNickname={profile.nickname}
              entryPath="receiver_home"
              returnUrl={publicPath}
              completeBackPath={publicPath}
              showTitle={false}
              toLocked
              submitLabel={
                isLoggedIn
                  ? "쪽지 보내기"
                  : "카카오로 로그인하고 쪽지 보내기"
              }
            />
          ) : null}
        </>
      )}
    </main>
  );
}
