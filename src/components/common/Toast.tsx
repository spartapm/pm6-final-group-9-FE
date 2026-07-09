"use client";

import { useEffect, useState } from "react";

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
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4DA3FF]"
        aria-hidden
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path
            d="M1 4.2 3.6 6.8 9 1.2"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
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

  const showIcon = message.variant !== "default";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
      <div
        className={`flex max-w-[340px] items-center gap-2.5 rounded-full bg-[#2B2B2B] px-4 py-3 text-[14px] font-medium leading-snug text-white shadow-[0_4px_16px_rgba(0,0,0,0.18)] ${
          showIcon ? "" : "px-5"
        }`}
        role="status"
        aria-live="polite"
      >
        {showIcon ? <ToastIcon variant={message.variant} /> : null}
        <span className="text-left">{message.text}</span>
      </div>
    </div>
  );
}
