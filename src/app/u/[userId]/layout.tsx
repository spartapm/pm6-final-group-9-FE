import type { Metadata } from "next";
import type { ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  let nickname = "친구";
  try {
    const res = await fetch(`${API_URL}/profiles/${userId}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: { nickname?: string } };
      if (json.data?.nickname) nickname = json.data.nickname;
    }
  } catch {
    // 프로필 조회 실패 시 기본 문구로 대체
  }

  const description = `${nickname}에게 다정한 한마디를 써주세요!`;

  return {
    title: "구구레터",
    description,
    openGraph: {
      title: "구구레터",
      description,
      images: [
        {
          url: "/images/og-cover.png",
          width: 1200,
          height: 630,
          alt: "구구레터",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "구구레터",
      description,
      images: ["/images/og-cover.png"],
    },
  };
}

export default function PublicHomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
