"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { redirectToOnboarding } from "@/lib/auth-redirect";
import { ErrorState } from "@/components/common/ErrorState";
import type { Letter } from "@/types";

export default function ClaimLetterPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function claim() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        redirectToOnboarding(router, "MESSAGE_READ", `/l/${params.token}`);
        return;
      }

      try {
        const res = await apiFetch<{ data: Letter }>(
          `/letters/claim/${params.token}`,
          { method: "POST" }
        );
        router.replace(`/letters/received/${res.data.id}`);
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          setError("접근 할 수 없는 화면이에요");
        } else if (e instanceof ApiError && e.status === 404) {
          setError("존재하지 않는 쪽지예요");
        } else {
          setError("쪽지를 불러오지 못했어요.");
        }
        setLoading(false);
      }
    }
    claim();
  }, [params.token, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
        <Image
          src="/images/success-gugu.svg"
          alt=""
          width={140}
          height={112}
          aria-hidden
          className="mb-6 animate-pulse"
        />
        <p className="text-sm text-[var(--color-text-secondary)]">
          쪽지를 연결하는 중…
        </p>
      </main>
    );
  }

  if (error) {
    return <ErrorState title={error} homeHref="/home" />;
  }

  return null;
}
