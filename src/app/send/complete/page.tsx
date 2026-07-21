"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav, mainTabPaddingClass } from "@/components/layout/BottomNav";
import { GuideTooltip } from "@/components/common/GuideTooltip";
import { toast } from "@/components/common/Toast";
import { FigmaImage } from "@/components/ui/FigmaImage";

function CompleteContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "link";
  const shareUrl = searchParams.get("url");
  const backHref = searchParams.get("back") ?? "/home";
  const [copying, setCopying] = useState(false);

  async function copyLink() {
    if (!shareUrl || copying) return;
    setCopying(true);
    toast("링크를 복사하고 있어요", { variant: "loading" });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("링크가 복사되었습니다", { variant: "success" });
    } catch {
      toast("링크 복사에 실패했어요. 다시 시도해주세요.", { variant: "error" });
    } finally {
      setCopying(false);
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
            <FigmaImage
              src="/images/figma/success-gugu.svg"
              alt="구구"
              width={132}
              height={111}
              className="mb-10 h-auto w-[132px] object-contain"
            />
            <p className="text-center text-[18px] font-medium leading-relaxed text-black">
              쪽지가 잘 전해졌어요 !
            </p>
          </div>

          <Link
            href="/home?tab=sent"
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-primary-dark)] text-[18px] font-bold text-white"
          >
            내가 보낸 쪽지함으로 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex min-h-screen flex-col bg-[var(--color-bg-content)] ${mainTabPaddingClass}`}
    >
      <AppHeader backHref="/write" backLabel="" variant="content" />

      <div className="flex flex-1 flex-col px-[34px] pb-8 pt-6">
        <div className="flex flex-1 flex-col items-center">
          <FigmaImage
            src="/images/figma/success-gugu.svg"
            alt="구구"
            width={132}
            height={111}
            className="mb-6 h-auto w-[132px] object-contain"
          />
          <p className="text-center text-[20px] font-semibold leading-[1.5] tracking-[-0.22px] text-[#484848]">
            구구가 소중한 마음을 전해드려요
          </p>

          {shareUrl ? (
            <div className="relative mt-10 w-full max-w-[325px]">
              <div className="mb-3 flex justify-center">
                <GuideTooltip arrow="bottom" emoji="✉️">
                  링크를 복사해 쪽지를 보내주세요!
                </GuideTooltip>
              </div>
              <button
                type="button"
                onClick={copyLink}
                disabled={copying}
                className="flex h-[53px] w-full items-center gap-2 overflow-hidden rounded-[16px] bg-white px-4 disabled:opacity-70"
              >
                <span className="min-w-0 flex-1 truncate text-center text-[18px] text-black">
                  {shareUrl}
                </span>
                <FigmaImage
                  src="/images/figma/icon-link-copy.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0"
                />
              </button>
              <p className="mt-5 text-center text-[15px] text-black">
                공유하지 않으면 보내지지 않아요
              </p>
            </div>
          ) : null}

          <Link
            href="/home"
            className="mt-auto pt-16 text-center text-[15px] text-black underline underline-offset-2"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>

      <BottomNav />
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
