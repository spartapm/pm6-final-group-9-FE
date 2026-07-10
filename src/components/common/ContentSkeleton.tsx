export function LetterCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[10px] bg-white px-4 py-4">
      <div className="flex gap-2.5">
        <div className="mt-0.5 h-[17px] w-[17px] shrink-0 rounded bg-[var(--color-surface-muted)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[var(--color-surface-muted)]" />
          <div className="h-4 w-full rounded bg-[var(--color-surface-muted)]" />
          <div className="h-3 w-1/4 rounded bg-[var(--color-surface-muted)] ml-auto" />
        </div>
      </div>
    </div>
  );
}

export function LetterDetailSkeleton() {
  return (
    <article className="w-full animate-pulse rounded-[16px] border border-black bg-white px-6 py-5">
      <div className="h-5 w-32 rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded bg-[var(--color-surface-muted)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--color-surface-muted)]" />
        <div className="h-4 w-2/3 rounded bg-[var(--color-surface-muted)]" />
      </div>
    </article>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="mx-auto h-5 w-40 rounded bg-[var(--color-surface-muted)]" />
      <div className="mx-auto h-3 w-32 rounded bg-[var(--color-surface-muted)]" />
      <div className="mt-4 h-10 w-full rounded-full bg-[var(--color-surface-muted)]" />
    </div>
  );
}
