"use client";

import { PrimaryButton } from "@/components/ui/Button";
import { FigmaImage } from "@/components/ui/FigmaImage";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  imageSrc?: string;
  imageWidth?: number;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  imageSrc = "/images/empty-inbox.svg",
  imageWidth = 65,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <FigmaImage
        src={imageSrc}
        alt=""
        width={imageWidth}
        height={Math.round(imageWidth * 0.88)}
        className="object-contain opacity-40"
      />
      <div className="leading-[1.6]">
        <p className="text-[17px] text-[rgba(27,31,38,0.72)] tracking-[-1px]">
          {title}
        </p>
        {description ? (
          <p className="text-[17px] text-[rgba(27,31,38,0.72)] tracking-[-1px]">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <PrimaryButton className="mt-2 max-w-xs" onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </div>
  );
}
