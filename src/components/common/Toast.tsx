"use client";

import { useEffect, useState } from "react";
import { FigmaImage } from "@/components/ui/FigmaImage";

export type ToastVariant = "default" | "loading" | "success" | "error";

type ToastMessage = {
  id: number;
  text: string;
  variant: ToastVariant;
};

let toastId = 0;
let dismissTimer: number | null = null;
const listeners = new Set<(msg: ToastMessage | null) => void>();

export function toast(
  text: string,
  options?: { variant?: ToastVariant; duration?: number }
) {
  const variant = options?.variant ?? "default";
  const msg = { id: ++toastId, text, variant };

  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  listeners.forEach((fn) => fn(msg));

  if (variant !== "loading") {
    const duration = options?.duration ?? 2500;
    dismissTimer = window.setTimeout(() => {
      listeners.forEach((fn) => fn(null));
      dismissTimer = null;
    }, duration);
  }
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "loading") {
    return (
      <span
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
        aria-hidden
      />
    );
  }

  if (variant === "success") {
    return (
      <FigmaImage
        src="/images/figma/icon-check-fill.svg"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0"
      />
    );
  }

  if (variant === "error") {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF4D4F] text-[12px] font-bold leading-none text-white"
        aria-hidden
      >
        !
      </span>
    );
  }

  return null;
}

export function ToastHost() {
  const [message, setMessage] = useState<ToastMessage | null>(null);

  useEffect(() => {
    listeners.add(setMessage);
    return () => {
      listeners.delete(setMessage);
    };
  }, []);

  if (!message) return null;

  const showIcon =
    message.variant === "success" ||
    message.variant === "loading" ||
    message.variant === "error";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[120px] z-50 flex justify-center px-6">
      <div
        className="flex h-14 w-full max-w-[360px] items-center gap-3 rounded-2xl bg-[var(--color-primary-dark)] px-6 text-[16px] font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
        role="status"
        aria-live="polite"
      >
        {showIcon ? <ToastIcon variant={message.variant} /> : null}
        <span className="text-left">{message.text}</span>
      </div>
    </div>
  );
}
