"use client";

import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";

type ErrorStateProps = {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  homeHref?: string;
};

export function ErrorState({
  title,
  description,
  retryLabel = "다시 시도",
  onRetry,
  homeHref = "/home",
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-2xl">
        !
      </div>
      <div>
        <p className="text-lg font-bold text-[var(--color-text)]">{title}</p>
        {description ? (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {onRetry ? (
          <PrimaryButton onClick={onRetry}>{retryLabel}</PrimaryButton>
        ) : null}
        <Link href={homeHref} className="block w-full">
          <SecondaryButton type="button" className="pointer-events-none">
            홈으로
          </SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
