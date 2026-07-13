"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/components/common/Toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { track } from "@/lib/analytics";
import { useDraftStore } from "@/lib/draft-store";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";
import { MESSAGE_GUIDES, type Letter } from "@/types";

const GUIDE_EMOJI: Record<string, string> = {
  thanks: "❤️",
  cheer: "💪",
  congrats: "🎉",
  hello: "☀️",
};

type WriteLetterFormProps = {
  receiverId: string | null;
  receiverNickname: string | null;
  entryPath: "receiver_home" | "sender_home";
  returnUrl: string;
  showTitle?: boolean;
  submitLabel: string;
  showSubmitIcon?: boolean;
  completeBackPath?: string;
  fillHeight?: boolean;
};

export function WriteLetterForm({
  receiverId,
  receiverNickname,
  entryPath,
  returnUrl,
  showTitle = true,
  submitLabel,
  showSubmitIcon = false,
  completeBackPath,
  fillHeight = true,
}: WriteLetterFormProps) {
  const router = useRouter();
  const draft = useDraftStore((s) => s.draft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  const clearAuthContext = useDraftStore((s) => s.clearAuthContext);

  const [senderNickname, setSenderNickname] = useState(
    draft?.senderNickname ?? ""
  );
  const [content, setContent] = useState(draft?.content ?? "");
  const [focused, setFocused] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const nicknameRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    track("card_write_start", {
      receiver_id: receiverId,
      entry_path: entryPath === "receiver_home" ? "home_link" : "direct_url",
    });
  }, [receiverId, entryPath]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) clearAuthContext();
    });
  }, [clearAuthContext]);

  const nickOk = senderNickname.trim().length > 0;
  const contentLength = content.trim().length;
  const canSend = nickOk && contentLength > 0;
  const isAtLimit = content.length >= 200;
  const showGuideOverlay = !content.trim() && !focused;
  const showNicknamePlaceholder = !senderNickname && !nicknameFocused;

  function focusNickname() {
    setNicknameFocused(true);
    nicknameRef.current?.focus();
  }

  function focusContent() {
    setFocused(true);
    textareaRef.current?.focus();
  }

  async function sendLetter() {
    if (!canSend || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDraft({
          receiverId,
          receiverNickname,
          content: content.trim(),
          senderNickname: senderNickname.trim(),
          isAnonymous: false,
          entryPath,
          guideCategory: null,
        });
        redirectToOnboarding(router, "MESSAGE_WRITE", returnUrl);
        return;
      }

      const res = await apiFetch<{
        data: { letter: Letter; shareUrl: string | null };
      }>("/letters", {
        method: "POST",
        body: JSON.stringify({
          receiverId,
          content: content.trim(),
          senderNickname: senderNickname.trim(),
          isAnonymous: false,
          entryPath,
        }),
      });

      track("card_write_complete", {
        letter_id: res.data.letter.id,
        entry_path: entryPath,
      });

      clearDraft();

      if (res.data.shareUrl) {
        router.replace(
          `/send/complete?type=link&url=${encodeURIComponent(res.data.shareUrl)}`
        );
      } else {
        const backTo =
          completeBackPath ?? (receiverId ? `/u/${receiverId}` : "/home");
        router.replace(
          `/send/complete?type=direct&back=${encodeURIComponent(backTo)}`
        );
      }
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "전송에 실패했어요. 다시 시도해주세요"
      );
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <>
      <div
        className={`flex flex-col px-[30px] pt-6 pb-2 ${
          fillHeight ? "flex-1" : ""
        }`}
      >
        {showTitle ? (
          <h1 className="text-center text-[18px] font-medium text-black">
            쪽지를 작성해주세요
          </h1>
        ) : null}

        <div
          className={`flex w-full cursor-text flex-col items-center ${
            showTitle ? "mt-5" : "mt-2"
          }`}
          onClick={focusNickname}
        >
          <div className="relative w-full max-w-[196px]">
            {showNicknamePlaceholder ? (
              <span className="pointer-events-none absolute inset-x-0 top-0 text-center text-[16px] font-medium text-[#929292]">
                무슨 이름으로 보낼까요?
              </span>
            ) : null}
            <input
              ref={nicknameRef}
              value={senderNickname}
              maxLength={20}
              onChange={(e) => setSenderNickname(e.target.value)}
              onInput={(e) =>
                setSenderNickname((e.target as HTMLInputElement).value)
              }
              onFocus={() => setNicknameFocused(true)}
              onBlur={(e) => {
                if (!e.target.value.trim()) setNicknameFocused(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-center text-[20px] font-medium text-[#474747] outline-none"
            />
          </div>
          <div className="mt-2 h-px w-full max-w-[196px] bg-[#D4D4D4]" />
        </div>

        <div
          className="relative mt-5 min-h-[390px] rounded-2xl bg-white"
          onClick={showGuideOverlay ? focusContent : undefined}
        >
          {showGuideOverlay ? (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-y-auto rounded-2xl p-5">
              <p className="text-[14px] leading-5 text-[#C5C5C5]">
                마음을 전하는 게 서툴고 막막하다면?
                <br />
                아래 중 하나만 골라 이야기를 시작해 보세요.
              </p>
              <div className="mt-4 space-y-3">
                {MESSAGE_GUIDES.map((guide) => (
                  <div key={guide.id} className="block w-full text-left">
                    <p className="text-[14px] font-medium leading-6 text-[#C5C5C5]">
                      <span className="mr-2">{GUIDE_EMOJI[guide.id]}</span>
                      {guide.label}
                    </p>
                    <p className="pl-6 text-[13px] leading-5 text-[#C5C5C5]">
                      {guide.placeholder}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <textarea
            ref={textareaRef}
            value={content}
            maxLength={200}
            onChange={(e) => setContent(e.target.value)}
            onInput={(e) =>
              setContent((e.target as HTMLTextAreaElement).value)
            }
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              if (!e.target.value.trim()) setFocused(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              focusContent();
            }}
            className="min-h-[390px] w-full resize-none rounded-2xl bg-transparent p-5 text-[16px] leading-[1.6] tracking-[-0.32px] text-[#474747] outline-none"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          {isAtLimit ? (
            <p className="flex items-center gap-1.5 text-[15px] font-medium text-[#F04452]">
              최대글자수 제한
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full border border-[#F04452] text-[10px]">
                !
              </span>
            </p>
          ) : (
            <span />
          )}
          <p
            className={`text-[15px] font-medium ${
              isAtLimit ? "text-[#F42762]" : "text-[#C5C5C5]"
            }`}
          >
            {contentLength} / 200
          </p>
        </div>

        <button
          type="button"
          disabled={!canSend || sending}
          onClick={sendLetter}
          className={`relative mt-6 flex h-14 w-full items-center justify-center rounded-2xl text-[18px] font-bold text-white transition ${
            canSend && !sending ? "bg-[#474747]" : "bg-[#474747]/30"
          }`}
        >
          {sending ? "보내는 중…" : submitLabel}
          {showSubmitIcon && !sending ? (
            <Image
              src="/images/icon-send-plane.png"
              alt=""
              width={20}
              height={20}
              className="absolute right-5 h-5 w-5 mix-blend-lighten"
              aria-hidden
            />
          ) : null}
        </button>
      </div>
    </>
  );
}
