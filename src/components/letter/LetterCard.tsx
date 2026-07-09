import Image from "next/image";

type LetterCardProps = {
  senderLabel: string;
  content: string;
  toLabel?: string;
  className?: string;
  theme?: "default" | "warm" | "red" | "yellow";
};

const themeClass: Record<NonNullable<LetterCardProps["theme"]>, string> = {
  default: "bg-white",
  warm: "bg-white",
  red: "bg-[#FFF5F5]",
  yellow: "bg-[#FFFBEB]",
};

export function LetterCard({
  senderLabel,
  content,
  toLabel,
  className = "",
  theme = "default",
}: LetterCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-[var(--color-border)] ${themeClass[theme]} p-6 ${className}`}
    >
      <div className="pointer-events-none absolute -right-2 -top-2 opacity-30">
        <Image
          src="/images/icon-letter.png"
          alt=""
          width={48}
          height={48}
          aria-hidden
        />
      </div>
      {toLabel ? (
        <p className="mb-4 text-sm font-medium text-[var(--color-text-secondary)]">
          <span className="font-bold text-black">{toLabel}</span>
          <span>에게</span>
        </p>
      ) : null}
      <p className="relative whitespace-pre-wrap text-[15px] leading-[1.75] text-[var(--color-text-body)]">
        {content}
      </p>
      <p className="relative mt-8 text-right text-sm font-semibold text-[var(--color-text-secondary)]">
        From. {senderLabel}
      </p>
    </article>
  );
}
