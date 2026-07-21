"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/queries";

/**
 * letters 테이블 변경 시 홈 리스트/프로필을 invalidate.
 * Realtime이 비활성이면 무시되고, refetchOnWindowFocus / interval 폴백에 의존한다.
 */
export function useLettersRealtime(userId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`letters-home-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "letters",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.letters("received") });
          queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "letters",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.letters("sent") });
          queryClient.invalidateQueries({ queryKey: queryKeys.profile });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, userId]);
}
