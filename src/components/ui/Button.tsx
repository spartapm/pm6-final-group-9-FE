import type { ButtonHTMLAttributes, ReactNode } from "react";
import Image from "next/image";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
};

export function PrimaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-full bg-[var(--color-primary)] px-6 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-45 ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  fullWidth = true,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-full border border-[var(--color-border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--color-text)] transition active:scale-[0.98] ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function KakaoButton({
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-kakao)] px-6 py-3.5 text-sm font-semibold text-[var(--color-kakao-text,#191919)] transition active:scale-[0.98] ${className}`}
      {...props}
    >
      <Image
        src="/images/kakao-icon.png"
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px]"
        aria-hidden
      />
      {children}
    </button>
  );
}
