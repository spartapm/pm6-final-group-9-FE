import type { Metadata } from "next";
import type { ReactNode } from "react";

const description = "다정한 마음이 도착했어요!";

export const metadata: Metadata = {
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

export default function ClaimLetterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
