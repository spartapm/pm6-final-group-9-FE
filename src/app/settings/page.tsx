"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/common/Toast";
import { track } from "@/lib/analytics";
import { AppHeader } from "@/components/layout/AppHeader";
import { FigmaImage } from "@/components/ui/FigmaImage";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { queryKeys, useMyProfile } from "@/lib/queries";
import type { Profile } from "@/types";

const NICKNAME_MAX = 10;

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurSaveRef = useRef(false);
  const { data: profile, error: profileError, refetch } = useMyProfile();
  const { refreshing, distance, indicatorStyle } = usePullToRefresh({
    onRefresh: () => refetch(),
  });
  const [nickname, setNickname] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
    }
  }, [profile]);

  useEffect(() => {
    if (profileError) {
      router.replace("/onboarding");
    }
  }, [profileError, router]);

  function clampNickname(value: string) {
    return value.slice(0, NICKNAME_MAX);
  }

  function startEditing() {
    setNickname((current) => clampNickname(current));
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function saveNickname(rawValue?: string) {
    if (!profile || saving) return false;

    const value = clampNickname((rawValue ?? nickname).trim());
    if (!value) {
      toast("닉네임을 입력해주세요.");
      setNickname(profile.nickname);
      return false;
    }
    if (value === profile.nickname) {
      setNickname(profile.nickname);
      return true;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ data: Profile }>("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({ nickname: value }),
      });
      queryClient.setQueryData(queryKeys.profile, res.data);
      setNickname(res.data.nickname);
      return true;
    } catch (e) {
      toast(
        e instanceof ApiError
          ? e.message
          : "저장하지 못했어요. 다시 시도해주세요."
      );
      setNickname(profile.nickname);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function finishEditing(rawValue?: string) {
    await saveNickname(rawValue);
    setIsEditing(false);
  }

  async function handlePencilClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isEditing) {
      skipBlurSaveRef.current = true;
      await finishEditing(inputRef.current?.value ?? nickname);
      inputRef.current?.blur();
      skipBlurSaveRef.current = false;
      return;
    }

    startEditing();
  }

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      queryClient.clear();
      window.location.replace("/splash");
    } catch {
      toast("로그아웃에 실패했어요. 다시 시도해주세요.");
      setBusy(false);
      setLogoutOpen(false);
    }
  }

  async function handleWithdraw() {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/profiles/me", { method: "DELETE" });
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
      queryClient.clear();
      window.location.replace("/splash");
    } catch {
      toast("회원탈퇴에 실패했어요. 다시 시도해주세요.");
      setBusy(false);
      setWithdrawOpen(false);
    }
  }

  function handleInquiry() {
    track("inquiry_click", {});
    window.location.href = "mailto:guguletter@gmail.com";
  }

  const showLimitWarning = isEditing && nickname.length >= NICKNAME_MAX;

  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-white">
      <div
        className="flex items-center justify-center overflow-hidden text-[12px] text-[#787878] transition-all"
        style={indicatorStyle}
        aria-hidden={!refreshing && distance < 8}
      >
        {refreshing || distance >= 40
          ? "새로고침 중…"
          : distance > 8
            ? "당겨서 새로고침"
            : null}
      </div>
      <AppHeader backHref="/home" backLabel="" />

      <div className="flex flex-1 flex-col px-8 pb-10 pt-8">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[280px]">
            <div className="relative flex items-center justify-center">
              <input
                ref={inputRef}
                value={nickname}
                readOnly={!isEditing || !profile}
                disabled={saving || !profile}
                onChange={(e) => {
                  if (!isEditing) return;
                  setNickname(clampNickname(e.target.value));
                }}
                onFocus={() => {
                  if (!isEditing) startEditing();
                }}
                onBlur={() => {
                  if (skipBlurSaveRef.current) return;
                  if (!isEditing) return;
                  void finishEditing(inputRef.current?.value ?? nickname);
                }}
                onKeyDown={(e) => {
                  if (!isEditing) return;
                  if (e.key === "Enter") {
                    e.preventDefault();
                    skipBlurSaveRef.current = true;
                    void finishEditing(e.currentTarget.value).finally(() => {
                      e.currentTarget.blur();
                      skipBlurSaveRef.current = false;
                    });
                  }
                }}
                className={`mx-auto -my-3 w-[calc(100%-104px)] bg-transparent py-3 text-center text-[20px] font-semibold tracking-[-1px] text-black outline-none ${
                  isEditing ? "cursor-text" : "cursor-default"
                }`}
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handlePencilClick}
                className="absolute right-3 top-[calc(50%+6px)] flex h-10 w-10 shrink-0 -translate-y-1/2 items-center justify-center"
                aria-label={isEditing ? "닉네임 저장" : "닉네임 수정"}
              >
                <FigmaImage
                  src="/images/figma/icon-edit-pencil.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
              </button>
            </div>
            <div className="mt-2 h-px w-[168px] mx-auto bg-[var(--color-border)]" />
          </div>

          {showLimitWarning ? (
            <p className="mt-3 flex items-center justify-center gap-1 text-[13px] font-medium text-[#F04452]">
              한글/영문으로 10자까지만 가능해요
              <span className="flex h-[13px] w-[13px] items-center justify-center rounded-full border border-[#F04452] text-[10px]">
                i
              </span>
            </p>
          ) : (
            <div className="mt-3 h-[19px]" />
          )}
        </div>

        <div className="mt-16 flex flex-col items-center space-y-3.5">
          <Link
            href="/settings/terms"
            className="flex h-[39px] w-[233px] items-center justify-center rounded-2xl border border-[#EBEBEB] bg-white text-[14px] font-semibold text-[#353535]"
          >
            서비스 약관 및 방침
          </Link>
          <button
            type="button"
            onClick={handleInquiry}
            className="flex h-[39px] w-[233px] items-center justify-center rounded-2xl border border-[#EBEBEB] bg-white text-[14px] font-semibold text-[#353535]"
          >
            문의하기
          </button>
        </div>

        <p className="mt-10 flex items-baseline justify-center gap-2 text-center">
          <span className="text-[14px] font-semibold text-[#353535]">
            버전 정보
          </span>
          <span className="text-[12px] font-semibold text-[#9C9C9C]">0.1.0</span>
        </p>

        <div className="mt-auto pt-16 text-center text-[16px] font-bold text-[var(--color-primary)]">
          <button type="button" onClick={() => setLogoutOpen(true)}>
            로그아웃
          </button>
          <span className="mx-4 inline-block h-[21px] w-px bg-[rgba(60,60,67,0.36)] align-middle opacity-50" />
          <button type="button" onClick={() => setWithdrawOpen(true)}>
            탈퇴하기
          </button>
        </div>

        <p className="mt-6 text-center text-[12px] font-semibold text-[#C6C6C6]">
          Copyright(c) 구구레터. All rights reserved
        </p>
      </div>

      {logoutOpen ? (
        <ConfirmModal
          title="로그아웃 하시겠습니까?"
          busy={busy}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={handleLogout}
        />
      ) : null}

      {withdrawOpen ? (
        <ConfirmModal
          title="정말 탈퇴하시겠습니까?"
          busy={busy}
          onCancel={() => setWithdrawOpen(false)}
          onConfirm={handleWithdraw}
        />
      ) : null}
    </main>
  );
}

function ConfirmModal({
  title,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
      <div className="mx-auto w-[80%] max-w-[300px] rounded-[20px] bg-white p-6 text-center">
        <p className="text-base font-bold text-[var(--color-text)]">{title}</p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-3 text-sm font-medium disabled:opacity-50"
          >
            아니요
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {busy ? "처리 중…" : "예"}
          </button>
        </div>
      </div>
    </div>
  );
}
