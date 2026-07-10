import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { Letter, Profile } from "@/types";

export const queryKeys = {
  profile: ["profile", "me"] as const,
  letters: (tab: "received" | "sent") => ["letters", tab] as const,
  letterReceived: (id: string) => ["letters", "received", id] as const,
  letterSent: (id: string) => ["letters", "sent", id] as const,
  publicProfile: (slug: string) => ["profiles", slug] as const,
};

type LetterListResponse = {
  data: { items: Letter[]; nextCursor: string | null };
};

type LetterPage = { items: Letter[]; nextCursor: string | null };

export function useMyProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () =>
      apiFetch<{ data: Profile }>("/profiles/me").then((r) => r.data),
    enabled,
  });
}

export function useLetters(tab: "received" | "sent", enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.letters(tab),
    queryFn: ({ pageParam }) => {
      const base =
        tab === "received" ? "/letters/received" : "/letters/sent";
      const path = pageParam
        ? `${base}?cursor=${pageParam}&limit=20`
        : `${base}?limit=20`;
      return apiFetch<LetterListResponse>(path).then((r) => r.data);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

export function useReceivedLetter(id: string) {
  return useQuery({
    queryKey: queryKeys.letterReceived(id),
    queryFn: () =>
      apiFetch<{ data: Letter & { reaction: string | null } }>(
        `/letters/received/${id}`
      ).then((r) => r.data),
  });
}

export function useSentLetter(id: string) {
  return useQuery({
    queryKey: queryKeys.letterSent(id),
    queryFn: () =>
      apiFetch<{
        data: Letter & { reaction: string | null; is_opened: boolean };
      }>(`/letters/sent/${id}`).then((r) => r.data),
  });
}

export function usePublicProfile(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicProfile(slug),
    queryFn: () =>
      apiFetch<{ data: Profile }>(`/profiles/${slug}`, { auth: false }).then(
        (r) => r.data
      ),
  });
}

export function flattenLetters(
  data: { pages: LetterPage[] } | undefined
): Letter[] {
  return data?.pages.flatMap((page) => page.items) ?? [];
}
