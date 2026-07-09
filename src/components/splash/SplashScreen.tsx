"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SPLASH_MS = 2200;

export function SplashScreen({
  onComplete,
}: {
  onComplete?: (target: "/home" | "/onboarding") => void;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 50);

    async function finish() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const target = user ? "/home" : "/onboarding";
      onComplete?.(target);
      router.replace(target);
    }

    const navTimer = window.setTimeout(finish, SPLASH_MS);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(navTimer);
    };
  }, [router, onComplete]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div
        className={`flex flex-col items-center transition-all duration-700 ease-out ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <Image
          src="/images/splash-pigeon.png"
          alt="구구"
          width={176}
          height={148}
          priority
          className="h-auto w-[176px] select-none"
          draggable={false}
        />
        <div className="relative mt-10">
          <Image
            src="/images/splash-envelope.svg"
            alt=""
            width={22}
            height={22}
            className="absolute -left-5 top-[18px] h-[22px] w-[22px]"
            aria-hidden
          />
          <Image
            src="/images/splash-logo-gugu-letter.png"
            alt="GUGU LETTER"
            width={160}
            height={98}
            priority
            className="h-auto w-[160px] select-none"
            draggable={false}
          />
        </div>
      </div>
    </main>
  );
}
