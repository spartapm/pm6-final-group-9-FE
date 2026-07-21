type LetterPaperCardProps = {
  toLabel: string;
  fromLabel: string;
  content: string;
  footer?: string | null;
  className?: string;
};

/** 미리보기·받은/보낸 상세 공통 쪽지 카드 (시안 radius 16 + black border) */
export function LetterPaperCard({
  toLabel,
  fromLabel,
  content,
  footer = null,
  className = "",
}: LetterPaperCardProps) {
  return (
    <article
      className={`flex w-full flex-col gap-4 rounded-[16px] border border-black bg-white px-6 py-5 ${className}`}
    >
      <p className="text-[16px] font-semibold text-[var(--color-text)]">
        To. {toLabel}
      </p>
      <p className="whitespace-pre-wrap text-[16px] leading-[1.6] tracking-[-0.32px] text-[var(--color-primary)]">
        {content}
      </p>
      <p className="text-right text-[16px] font-semibold text-[var(--color-text)]">
        From. {fromLabel}
      </p>
      {footer ? (
        <p className="text-right text-[12px] text-[var(--color-text-secondary)]">
          {footer}
        </p>
      ) : null}
    </article>
  );
}
