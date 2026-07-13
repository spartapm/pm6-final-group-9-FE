"use client";

import Image from "next/image";
import { PrimaryButton } from "@/components/ui/Button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  imageSrc?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  imageSrc = "/images/empty-inbox.svg",
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <Image src={imageSrc} alt="" width={65} height={57} className="h-[57px] w-[65px]" aria-hidden />
      <div>
        <p className="text-base font-semibold text-[var(--color-text-body)]">
          {title}
        </p>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
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
