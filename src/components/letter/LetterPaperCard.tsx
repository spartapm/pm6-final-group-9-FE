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
      className={`flex w-full flex-col gap-5 rounded-[16px] border border-black bg-white px-6 py-5 ${className}`}
    >
      <p className="text-[18px] font-semibold text-[var(--color-text)]">
        To. {toLabel}
      </p>
      <p className="whitespace-pre-wrap text-[16px] leading-[1.5] tracking-[-0.32px] text-[var(--color-letter-ink)]">
        {content}
      </p>
      <p className="text-right text-[18px] font-semibold text-[var(--color-text)]">
        From. {fromLabel}
      </p>
      {footer ? (
        <p className="-mt-3 text-right text-[12px] font-medium text-[#787878]">
          {footer}
        </p>
      ) : null}
    </article>
  );
}
