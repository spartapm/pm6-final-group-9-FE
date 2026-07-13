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
import { queryKeys, useMyProfile } from "@/lib/queries";
import type { Profile } from "@/types";

const NICKNAME_MAX = 10;

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurSaveRef = useRef(false);
  const { data: profile, error: profileError } = useMyProfile();
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
    <main className="flex min-h-screen flex-col bg-white">
      <AppHeader backHref="/home" backLabel="" />

      <div className="flex flex-1 flex-col px-8 pb-10 pt-8">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[280px]">
            <div className="flex items-center justify-center gap-2 pr-1">
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
                className={`min-w-0 flex-1 bg-transparent text-center text-[18px] font-medium text-black outline-none ${
                  isEditing ? "cursor-text" : "cursor-default"
                }`}
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handlePencilClick}
                className="shrink-0"
                aria-label={isEditing ? "닉네임 저장" : "닉네임 수정"}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M9.5 2.5 11.5 4.5M2 12l.5-3.5L9.5 2l3 3L5.5 11.5 2 12Z"
                    stroke="#9A9A9A"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 h-px w-full bg-[#D4D4D4]" />
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

        <div className="mt-16 flex flex-col items-center space-y-3">
          <Link
            href="/settings/terms"
            className="flex h-[45px] w-[80%] items-center justify-center rounded-xl border border-[#D4D4D4] bg-white text-[13px] font-bold text-black"
          >
            서비스 약관 및 방침
          </Link>
          <button
            type="button"
            onClick={handleInquiry}
            className="flex h-[45px] w-[80%] items-center justify-center rounded-xl border border-[#D4D4D4] bg-white text-[13px] font-bold text-black"
          >
            문의하기
          </button>
        </div>

        <p className="mt-8 text-center text-[14px] text-black">
          <span className="font-medium">버전 정보</span>{" "}
          <span className="text-black">0.1.0</span>
        </p>

        <div className="mt-auto pt-16 text-center text-[14px] font-medium text-black">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="text-black"
          >
            로그아웃
          </button>
          <span className="mx-3 text-[#D4D4D4]">|</span>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="text-black"
          >
            탈퇴하기
          </button>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#C5C5C5]">
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
            className="flex-1 rounded-xl bg-[#474747] py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {busy ? "처리 중…" : "예"}
          </button>
        </div>
      </div>
    </div>
  );
}
