import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

function resolveMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const candidate = raw
    ? /^https?:\/\//i.test(raw)
      ? raw
      : `https://${raw}`
    : "http://localhost:3000";
  try {
    return new URL(candidate);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "구구레터",
  description: "친구에게 마음을 쪽지로 전하는 구구레터",
  openGraph: {
    title: "구구레터",
    description: "친구에게 마음을 쪽지로 전하는 구구레터",
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
    description: "친구에게 마음을 쪽지로 전하는 구구레터",
    images: ["/images/og-cover.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} h-full overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] antialiased`}
      >
        <Providers>
          <div className="relative mx-auto h-[100dvh] w-full max-w-[390px] overflow-y-auto overscroll-contain bg-[var(--color-bg)] shadow-[0_0_40px_rgba(0,0,0,0.06)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
