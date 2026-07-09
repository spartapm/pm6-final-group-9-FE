import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EntryPath, LetterDraft } from "@/types";

type DraftState = {
  draft: LetterDraft | null;
  returnUrl: string | null;
  entryPath: EntryPath | null;
  setDraft: (draft: LetterDraft) => void;
  clearDraft: () => void;
  setAuthContext: (entryPath: EntryPath, returnUrl: string) => void;
  clearAuthContext: () => void;
};

const emptyDraft: LetterDraft = {
  receiverId: null,
  receiverNickname: null,
  content: "",
  senderNickname: "",
  isAnonymous: false,
  entryPath: "sender_home",
  guideCategory: null,
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      draft: null,
      returnUrl: null,
      entryPath: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
      setAuthContext: (entryPath, returnUrl) => set({ entryPath, returnUrl }),
      clearAuthContext: () => set({ entryPath: null, returnUrl: null }),
    }),
    { name: "guguletter-draft" }
  )
);

export { emptyDraft };
