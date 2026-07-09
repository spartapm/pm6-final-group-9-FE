"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { toast } from "@/components/common/Toast";

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 8.5 10 2l7 6.5V17a1 1 0 0 1-1 1h-4.5v-5.5H8.5V18H4a1 1 0 0 1-1-1V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "link";
  const shareUrl = searchParams.get("url");
  const backHref = searchParams.get("back") ?? "/home";

  async function shareLink() {
    if (!shareUrl) return;

    const shareData = {
      title: "구구레터",
      text: "소중한 마음을 전해요",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast("링크가 복사되었어요.");
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast("링크가 복사되었어요.");
      } catch {
        toast("공유에 실패했어요. 다시 시도해주세요.");
      }
    }
  }

  if (type === "direct") {
    return (
      <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)]">
        <AppHeader
          backHref={backHref}
          backLabel="친구 홈으로 돌아가기"
          variant="content"
        />

        <div className="flex flex-1 flex-col px-[34px] pb-10 pt-16">
          <div className="flex flex-1 flex-col items-center justify-center">
            <Image
              src="/images/success-gugu.png"
              alt="구구"
              width={132}
              height={111}
              className="mb-10 h-auto w-[132px]"
              priority
            />
            <p className="text-center text-[18px] font-medium leading-relaxed text-black">
              쪽지가 잘 전해졌어요 !
            </p>
          </div>

          <Link
            href="/home?tab=sent"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#2C2C2C] text-[18px] font-bold text-white"
          >
            내가 보낸 쪽지함으로 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg-content)] px-[34px] pb-10 pt-24">
      <div className="flex flex-1 flex-col items-center">
        <Image
          src="/images/success-gugu.png"
          alt="구구"
          width={132}
          height={111}
          className="mb-10 h-auto w-[132px]"
          priority
        />
        <p className="text-center text-[18px] font-medium leading-relaxed text-black">
          구구가 소중한 마음을
          <br />
          전해드려요
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={shareLink}
          className="h-14 w-full rounded-2xl bg-[#2C2C2C] text-[18px] font-bold text-white"
        >
          친구에게 쪽지 링크로 보내기
        </button>

        <p className="text-center text-[13px] text-[#929292]">
          친구에게 공유하지 않으면 보내지지 않아요
        </p>

        <Link
          href="/home"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#474747] bg-white text-[18px] font-bold text-[#474747]"
        >
          <HomeIcon />
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

export default function SendCompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}
