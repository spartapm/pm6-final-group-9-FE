"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { WriteLetterForm } from "@/components/letter/WriteLetterForm";
import { ProfileHeaderSkeleton } from "@/components/common/ContentSkeleton";
import { ApiError } from "@/lib/api-client";
import { ErrorState } from "@/components/common/ErrorState";
import { track } from "@/lib/analytics";
import { usePublicProfile } from "@/lib/queries";

function FriendHomeHeader() {
  return (
    <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center justify-center bg-[var(--color-bg-content)] px-5 pt-[env(safe-area-inset-top)]">
      <Link
        href="/home"
        className="absolute left-5 flex h-9 w-9 items-center justify-center"
        aria-label="홈으로"
      >
        <Image
          src="/images/icon-home-back.png"
          alt=""
          width={31}
          height={28}
          className="h-[28px] w-[31px]"
          aria-hidden
        />
      </Link>
      <Link href="/home" aria-label="구구레터 홈">
        <Image
          src="/images/logo-gugu-letter-gray.png"
          alt="GUGU LETTER"
          width={150}
          height={16}
          className="h-4 w-[150px]"
          priority
        />
      </Link>
    </header>
  );
}

export default function PublicHomePage() {
  const params = useParams<{ userId: string }>();
  const { data: profile, error, isPending } = usePublicProfile(params.userId);

  const publicPath = `/u/${params.userId}`;

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
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)] pb-8">
      <FriendHomeHeader />

      {errorMessage && !profile ? (
        <ErrorState title={errorMessage} homeHref="/login" />
      ) : (
        <>
          <section className="px-6 pb-5 pt-4">
            {profile ? (
              <>
                <h1 className="text-center text-[18px] tracking-[-0.5px] text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-black">{profile.nickname}</span>
                  의 쪽지함
                </h1>

                {profile.status_message ? (
                  <p className="mt-4 rounded-full border border-[var(--color-border-light)] bg-white px-4 py-2.5 text-center text-[13px] leading-snug text-[var(--color-text-secondary)]">
                    {profile.status_message}
                  </p>
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
              submitLabel="친구에게 쪽지 써주기"
              showSubmitIcon
            />
          ) : null}
        </>
      )}
    </main>
  );
}
