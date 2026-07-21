"use client";

import type { ReactNode } from "react";

type GuideTooltipProps = {
  children: ReactNode;
  onClose?: () => void;
  /** 꼬리 방향 */
  arrow?: "top" | "bottom";
  className?: string;
  emoji?: string | null;
};

/** 공유/로그인 안내 말풍선 */
export function GuideTooltip({
  children,
  onClose,
  arrow = "bottom",
  className = "",
  emoji = "✉️",
}: GuideTooltipProps) {
  return (
    <div className={`relative z-10 w-max max-w-[min(282px,90vw)] ${className}`}>
      {arrow === "top" ? (
        <span className="absolute left-1/2 bottom-full -translate-x-1/2 border-[6px] border-transparent border-b-[#2C2C2C]" />
      ) : null}
      <div className="relative flex items-center justify-center gap-1.5 rounded-[10px] bg-[#2C2C2C] px-3 py-2.5 text-center text-[13px] font-medium leading-[1.3] tracking-[-0.13px] text-white">
        {emoji ? <span className="shrink-0 text-[13px]" aria-hidden>{emoji}</span> : null}
        <span className="min-w-0">{children}</span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ml-1 shrink-0 text-white/70"
            aria-label="닫기"
          >
            ×
          </button>
        ) : null}
      </div>
      {arrow === "bottom" ? (
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#2C2C2C]" />
      ) : null}
    </div>
  );
}
