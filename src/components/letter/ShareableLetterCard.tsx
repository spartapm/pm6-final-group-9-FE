import { forwardRef } from "react";

const SHARE_BG = "#f5f3ed";
const SHARE_LOGO_SRC = "/images/splash-logo-gugu-letter.png";

type ShareableLetterCardProps = {
  senderLabel: string;
  content: string;
};

export const ShareableLetterCard = forwardRef<
  HTMLDivElement,
  ShareableLetterCardProps
>(function ShareableLetterCard({ senderLabel, content }, ref) {
  return (
    <div
      ref={ref}
      className="flex w-[390px] flex-col items-center bg-[#f5f3ed] px-6 py-14"
      style={{ backgroundColor: SHARE_BG }}
    >
      <div className="w-full pt-4">
        <article className="rounded-[16px] border border-black bg-white px-6 py-5">
          <p className="text-[18px] font-semibold text-[#1F1F1F]">
            From. {senderLabel}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-[14px] leading-[1.5] tracking-[-0.32px] text-[#191F28]">
            {content}
          </p>
        </article>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SHARE_LOGO_SRC}
        alt=""
        width={160}
        height={98}
        className="mt-12 h-auto w-[160px]"
        draggable={false}
      />
    </div>
  );
});

export async function preloadShareAssets() {
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load share logo"));
    img.src = SHARE_LOGO_SRC;
  });
}

export const SHARE_CARD_CAPTURE_OPTIONS = {
  pixelRatio: 2,
  backgroundColor: SHARE_BG,
  cacheBust: true,
} as const;
