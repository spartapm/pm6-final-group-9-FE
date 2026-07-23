"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GuideTooltip } from "@/components/common/GuideTooltip";
import { toast } from "@/components/common/Toast";
import { FigmaImage } from "@/components/ui/FigmaImage";
import { KakaoButton, PrimaryButton } from "@/components/ui/Button";
import { useDraftStore } from "@/lib/draft-store";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { MESSAGE_GUIDES } from "@/types";

const GUIDE_ICONS: Record<string, string> = {
  thanks: "/images/figma/guide-icon-heart.svg",
  cheer: "/images/figma/guide-icon-cheer.svg",
  congrats: "/images/figma/guide-icon-congrats.svg",
  hello: "/images/figma/guide-icon-hello.svg",
};

type WriteLetterFormProps = {
  receiverId: string | null;
  receiverNickname: string | null;
  entryPath: "receiver_home" | "sender_home";
  returnUrl: string;
  showTitle?: boolean;
  submitLabel?: string;
  showSubmitIcon?: boolean;
  completeBackPath?: string;
  fillHeight?: boolean;
  replyToLetterId?: string | null;
  toLocked?: boolean;
  fromLocked?: boolean;
  initialSenderNickname?: string | null;
  guideText?: string | null;
};

export function WriteLetterForm({
  receiverId,
  receiverNickname,
  entryPath,
  returnUrl: _returnUrl,
  showTitle = true,
  submitLabel,
  showSubmitIcon = false,
  completeBackPath,
  fillHeight = true,
  replyToLetterId = null,
  toLocked = false,
  fromLocked = false,
  initialSenderNickname = null,
  guideText = null,
}: WriteLetterFormProps) {
  const router = useRouter();
  const draft = useDraftStore((s) => s.draft);
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearAuthContext = useDraftStore((s) => s.clearAuthContext);

  const isMyHome = entryPath === "sender_home" && !replyToLetterId;
  const isFriendHome = entryPath === "receiver_home" && !replyToLetterId;

  const [toNickname, setToNickname] = useState(
    draft?.receiverNickname ?? receiverNickname ?? ""
  );
  const [senderNickname, setSenderNickname] = useState(
    draft?.senderNickname ?? initialSenderNickname ?? ""
  );
  const [content, setContent] = useState(draft?.content ?? "");
  const [focused, setFocused] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
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
      setIsLoggedIn(Boolean(data.user));
      if (data.user) clearAuthContext();
    });
  }, [clearAuthContext]);

  useEffect(() => {
    if (toLocked || isFriendHome) {
      setToNickname(receiverNickname ?? draft?.receiverNickname ?? "");
    }
  }, [toLocked, isFriendHome, receiverNickname, draft?.receiverNickname]);

  useEffect(() => {
    if (fromLocked && initialSenderNickname) {
      setSenderNickname(initialSenderNickname);
    }
  }, [fromLocked, initialSenderNickname]);

  const toOk = toNickname.trim().length > 0;
  const fromOk = senderNickname.trim().length > 0;
  const contentLength = content.trim().length;
  const canProceed = toOk && fromOk && contentLength > 0;
  const isAtLimit = content.length >= 200;
  const showGuideOverlay = !content.trim() && !focused;

  const defaultGuide = isMyHome
    ? "친구에게 보낼 쪽지를 작성하고\n완성되면 링크로 보내요"
    : null;
  const topGuide = guideText ?? defaultGuide;

  const guestFriendHome = isFriendHome && isLoggedIn === false;
  const buttonLabel =
    submitLabel ??
    (guestFriendHome ? "카카오로 로그인하고 쪽지 보내기" : "쪽지 보내기");

  function focusContent() {
    setFocused(true);
    textareaRef.current?.focus();
  }

  function resolveTargetReceiverId() {
    if (receiverId) return receiverId;
    const existing = useDraftStore.getState().draft;
    if (
      existing?.entryPath === "receiver_home" &&
      existing.receiverId
    ) {
      return existing.receiverId;
    }
    return null;
  }

  function saveDraftAndGoPreview(goLogin: boolean) {
    // 로그인 복귀 경합으로 내 홈(/write)에 떨어졌을 때도 친구홈 초안 맥락을 유지한다
    const existing = useDraftStore.getState().draft;
    const keepFriendHome =
      !receiverId &&
      existing?.entryPath === "receiver_home" &&
      Boolean(existing.receiverId);
    const nextReceiverId = keepFriendHome ? existing!.receiverId : receiverId;
    const nextEntryPath = keepFriendHome ? "receiver_home" : entryPath;

    setDraft({
      receiverId: nextReceiverId,
      receiverNickname: toNickname.trim(),
      content: content.trim(),
      senderNickname: senderNickname.trim(),
      isAnonymous: false,
      entryPath: nextEntryPath,
      guideCategory: null,
      replyToLetterId,
      toLocked: toLocked || isFriendHome || keepFriendHome,
      fromLocked,
      completeBackPath:
        completeBackPath ??
        (keepFriendHome && nextReceiverId ? `/u/${nextReceiverId}` : null),
    });

    if (goLogin) {
      redirectToOnboarding(router, "MESSAGE_WRITE", "/write/preview");
      return;
    }

    router.push("/write/preview");
  }

  async function onSubmit() {
    if (!canProceed) return;

    const targetReceiverId = resolveTargetReceiverId();
    if (targetReceiverId) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id === targetReceiverId) {
        toast("나에게는 쪽지를 보낼 수 없어요.");
        return;
      }
    }

    if (guestFriendHome) {
      saveDraftAndGoPreview(true);
      return;
    }

    if (isLoggedIn === false && !isFriendHome) {
      saveDraftAndGoPreview(true);
      return;
    }

    saveDraftAndGoPreview(false);
  }

  return (
    <div
      className={`flex flex-col px-[30px] pb-2 ${
        isMyHome ? "pt-8" : "pt-4"
      } ${fillHeight ? "flex-1" : ""}`}
    >
      {topGuide ? (
        <p
          className={`mb-6 whitespace-pre-line text-center text-[18px] leading-[1.5] tracking-[-0.2px] ${
            isMyHome
              ? "font-semibold text-[var(--color-text-guide)]"
              : "font-bold text-black"
          }`}
        >
          {topGuide}
        </p>
      ) : showTitle ? (
        <h1 className="mb-4 text-center text-[18px] font-medium text-black">
          쪽지를 작성해주세요
        </h1>
      ) : null}

      {/* To — 좌측 + 언더라인 */}
      <div className="mb-4 flex items-end gap-2">
        <span className="shrink-0 pb-1 text-[18px] font-medium text-black">
          To.
        </span>
        {toLocked || isFriendHome ? (
          <span className="pb-1 text-[18px] font-medium text-black">
            {toNickname || "친구"}
          </span>
        ) : (
          <input
            value={toNickname}
            maxLength={20}
            onChange={(e) => setToNickname(e.target.value)}
            className="min-w-0 max-w-[131px] flex-1 border-b border-black bg-transparent pb-1 text-center text-[18px] font-medium text-black outline-none"
          />
        )}
      </div>

      {/* Content — 시안 높이 390px */}
      <div
        className={`relative rounded-[16px] bg-white ${
          isMyHome ? "h-[390px]" : "h-[min(390px,52vh)]"
        }`}
        onClick={showGuideOverlay ? focusContent : undefined}
      >
        {showGuideOverlay ? (
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[16px] px-5 py-5">
            <p className="text-[14px] leading-[1.5] text-[var(--color-text-disabled)]">
              마음을 전하는 게 서툴고 막막하다면?
              <br />
              아래 중 하나만 골라 이야기를 시작해 보세요.
            </p>
            <div className="mt-4 space-y-2.5">
              {MESSAGE_GUIDES.map((guide) => (
                <div key={guide.id} className="flex gap-2.5 text-left">
                  <FigmaImage
                    src={GUIDE_ICONS[guide.id] ?? GUIDE_ICONS.thanks}
                    alt=""
                    width={14}
                    height={14}
                    className="mt-1 h-3.5 w-3.5 shrink-0 object-contain opacity-70"
                  />
                  <div>
                    <p className="text-[14px] font-medium leading-6 text-[var(--color-text-disabled)]">
                      {guide.label}
                    </p>
                    <p className="text-[14px] leading-6 text-[var(--color-text-disabled)]">
                      {guide.placeholder}
                    </p>
                  </div>
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
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (!e.target.value.trim()) setFocused(false);
          }}
          onClick={(e) => {
            e.stopPropagation();
            focusContent();
          }}
          className="h-full w-full resize-none rounded-[16px] bg-transparent p-5 pb-10 text-[16px] leading-[1.6] tracking-[-0.32px] text-[var(--color-primary)] outline-none"
        />

        <p
          className={`pointer-events-none absolute bottom-4 right-5 text-[15px] font-medium ${
            isAtLimit ? "text-[#F42762]" : "text-[var(--color-text-disabled)]"
          }`}
        >
          {contentLength} / 200
        </p>
      </div>

      {isAtLimit ? (
        <p className="mt-2 flex items-center gap-1.5 text-[15px] font-medium text-[#F04452]">
          최대글자수 제한
          <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full border border-[#F04452] text-[10px]">
            !
          </span>
        </p>
      ) : null}

      {/* From — 오른쪽 정렬 + 언더라인 */}
      <div className="mt-4 flex items-end justify-end gap-2">
        <span className="shrink-0 pb-1 text-[18px] font-medium text-black">
          From.
        </span>
        {fromLocked ? (
          <span className="pb-1 text-[18px] font-medium text-black">
            {senderNickname}
          </span>
        ) : (
          <input
            value={senderNickname}
            maxLength={20}
            onChange={(e) => setSenderNickname(e.target.value)}
            className="w-[131px] border-b border-black bg-transparent pb-1 text-center text-[18px] font-medium text-black outline-none"
          />
        )}
      </div>

      <div className={`relative ${guestFriendHome ? "mt-8" : "mt-6"}`}>
        {guestFriendHome ? (
          <div className="mb-3 flex justify-center">
            <GuideTooltip arrow="bottom" emoji="✉️">
              구구레터 첫 이용 시 간편 로그인이 필요해요
            </GuideTooltip>
          </div>
        ) : null}

        {guestFriendHome ? (
          <KakaoButton disabled={!canProceed} onClick={onSubmit}>
            {buttonLabel}
          </KakaoButton>
        ) : (
          <PrimaryButton disabled={!canProceed} onClick={onSubmit}>
            {buttonLabel}
            {showSubmitIcon ? (
              <FigmaImage
                src="/images/figma/icon-send-nav.svg"
                alt=""
                width={20}
                height={20}
                className="absolute right-5 h-5 w-5 brightness-0 invert"
              />
            ) : null}
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
