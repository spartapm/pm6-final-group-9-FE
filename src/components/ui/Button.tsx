import type { ButtonHTMLAttributes, ReactNode } from "react";
import { FigmaImage } from "@/components/ui/FigmaImage";

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
      className={`relative flex h-14 items-center justify-center rounded-2xl bg-[var(--color-primary-dark)] px-6 text-[18px] font-bold text-white transition active:scale-[0.98] disabled:opacity-30 ${fullWidth ? "w-full" : ""} ${className}`}
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
      className={`flex h-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-6 text-[18px] font-bold text-[var(--color-primary)] transition active:scale-[0.98] ${fullWidth ? "w-full" : ""} ${className}`}
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
      className={`relative flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--color-kakao)] px-6 text-[16px] font-semibold text-[var(--color-kakao-text)] transition active:scale-[0.98] ${className}`}
      {...props}
    >
      <FigmaImage
        src="/images/figma/kakao-btn-icon.svg"
        alt=""
        width={20}
        height={20}
        className="absolute left-6 h-5 w-5"
      />
      {children}
    </button>
  );
}
