import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: "구구레터",
  description: "소중한 마음을 전하는 쪽지",
  openGraph: {
    title: "구구레터",
    description: "소중한 마음을 전하는 쪽지",
    images: [
      {
        url: "/images/og-image.png",
        width: 417,
        height: 408,
        alt: "GUGU LETTER",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "구구레터",
    description: "소중한 마음을 전하는 쪽지",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased`}
      >
        <Providers>
          <div className="relative mx-auto min-h-screen w-full max-w-[390px] bg-[var(--color-bg)] shadow-[0_0_40px_rgba(0,0,0,0.06)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
