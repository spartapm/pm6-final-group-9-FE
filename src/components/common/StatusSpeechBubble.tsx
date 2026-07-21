"use client";

import type { ReactNode, RefObject } from "react";
import { FigmaImage } from "@/components/ui/FigmaImage";

type StatusSpeechBubbleProps = {
  children: ReactNode;
  editing?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  value?: string;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onStartEdit?: () => void;
  showEdit?: boolean;
  error?: boolean;
};

/** 꼬리 있는 상태메시지 말풍선 */
export function StatusSpeechBubble({
  children,
  editing = false,
  inputRef,
  value = "",
  maxLength = 18,
  placeholder = "상태메세지를 입력해주세요",
  disabled = false,
  onChange,
  onSave,
  onStartEdit,
  showEdit = true,
  error = false,
}: StatusSpeechBubbleProps) {
  return (
    <div className="relative mx-auto mt-3 w-full max-w-[307px]">
      <FigmaImage
        src={
          error
            ? "/images/figma/status-bubble-union-error.png"
            : "/images/figma/status-bubble-union.png"
        }
        alt=""
        width={307}
        height={58}
        className="h-auto w-full"
      />
      <div className="absolute inset-x-0 bottom-0 flex h-[44px] items-center px-5">
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            maxLength={maxLength}
            onChange={(e) => onChange?.(e.target.value.replace(/\n/g, ""))}
            placeholder={placeholder}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSave?.();
              }
            }}
            onBlur={() => onSave?.()}
            className="w-full bg-transparent py-3 pr-8 text-center text-[14px] text-[var(--color-text-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:placeholder:text-transparent"
          />
        ) : (
          <button
            type="button"
            onClick={showEdit ? onStartEdit : undefined}
            disabled={!showEdit}
            className={`flex-1 py-3 text-center text-[14px] leading-snug text-[var(--color-text-secondary)] ${
              showEdit ? "pr-8" : "cursor-default"
            }`}
          >
            {children}
          </button>
        )}
        {showEdit ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (editing) {
                onSave?.();
                return;
              }
              onStartEdit?.();
            }}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center"
            aria-label={editing ? "상태메시지 저장" : "상태메시지 수정"}
          >
            <FigmaImage
              src="/images/figma/icon-edit-pencil.svg"
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5"
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}
