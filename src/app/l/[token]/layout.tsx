import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "구구레터",
  description: "친구에게 도착한 쪽지를 확인해 보세요",
  openGraph: {
    title: "구구레터",
    description: "친구에게 도착한 쪽지를 확인해 보세요",
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
    description: "친구에게 도착한 쪽지를 확인해 보세요",
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
