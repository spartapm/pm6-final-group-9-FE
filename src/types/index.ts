export type Profile = {
  id: string;
  nickname: string;
  status_message: string | null;
  home_slug: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  received_count?: number;
  sent_count?: number;
};

export type Letter = {
  id: string;
  receiver_id: string | null;
  sender_id: string;
  sender_nickname: string;
  content: string;
  is_anonymous: boolean;
  delivery_type: "direct" | "link";
  read_at: string | null;
  is_hidden: boolean;
  is_onboarding?: boolean;
  created_at: string;
  reaction?: string | null;
  is_opened?: boolean;
  receiver_nickname?: string | null;
  shareUrl?: string | null;
};

export type LetterDraft = {
  receiverId: string | null;
  receiverNickname: string | null;
  content: string;
  senderNickname: string;
  isAnonymous: boolean;
  entryPath: "receiver_home" | "sender_home";
  guideCategory?: string | null;
  replyToLetterId?: string | null;
  toLocked?: boolean;
  fromLocked?: boolean;
  completeBackPath?: string | null;
};

export type EntryPath = "DIRECT" | "MESSAGE_READ" | "MESSAGE_WRITE";

export const MESSAGE_GUIDES = [
  {
    id: "thanks",
    label: "고마운 마음",
    placeholder: "그때 네가 해줬던 말이 아직도 기억나",
  },
  {
    id: "cheer",
    label: "응원하는 마음",
    placeholder: "요즘 많이 바쁠 텐데, 항상 응원하고 있어",
  },
  {
    id: "congrats",
    label: "축하하는 마음",
    placeholder: "좋은 소식 들었어! 정말 축하해",
  },
  {
    id: "hello",
    label: "안부 묻기",
    placeholder: "문득 네 생각이 나서 연락해",
  },
] as const;

export const REACTION_OPTIONS = [
  { emoji: "😊", label: "고마워" },
  { emoji: "🥰", label: "덕분이야" },
  { emoji: "😘", label: "최고야" },
  { emoji: "🥹", label: "감동이야" },
  { emoji: "🤭", label: "너밖에 없어" },
  { emoji: "😎", label: "화이팅" },
  { emoji: "🤩", label: "멋있어" },
  { emoji: "👏", label: "고생 많았어" },
  { emoji: "💪", label: "응원할게" },
  { emoji: "🍀", label: "행운을 빌어요" },
] as const;

export const REACTION_EMOJIS = REACTION_OPTIONS.map((item) => item.emoji);

export const REACTION_LABELS: Record<string, string> = Object.fromEntries(
  REACTION_OPTIONS.map((item) => [item.emoji, item.label])
);
