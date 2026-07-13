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
          src="/images/splash-logo.png"
          alt="GUGU LETTER"
          width={200}
          height={333}
          priority
          className="h-auto w-[200px] select-none"
          draggable={false}
        />
      </div>
    </main>
  );
}
