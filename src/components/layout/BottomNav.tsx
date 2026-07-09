"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  iconSrc: string;
  match?: (path: string) => boolean;
};

const items: NavItem[] = [
  {
    href: "/home",
    label: "쪽지함",
    iconSrc: "/images/icon-inbox-tab.png",
    match: (p) =>
      p === "/home" ||
      p.startsWith("/letters/") ||
      p === "/settings",
  },
  {
    href: "/write",
    label: "쪽지 보내기",
    iconSrc: "/images/icon-send-tab.png",
    match: (p) => p.startsWith("/write") || p.startsWith("/send/"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-[var(--color-border-light)] bg-white pb-[env(safe-area-inset-bottom,12px)] pt-2">
      <ul className="flex w-full items-end">
        {items.map((item) => {
          const active = item.match
            ? item.match(pathname)
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 text-[14px] font-medium tracking-[-0.5px] transition ${
                  active
                    ? "text-[var(--color-text-secondary)]"
                    : "text-[var(--color-text-secondary)] opacity-50"
                }`}
              >
                <Image
                  src={item.iconSrc}
                  alt=""
                  width={20}
                  height={20}
                  className={`h-5 w-5 ${active ? "" : "opacity-70"}`}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 하단 네비가 있는 메인 탭 화면용 패딩 */
export const mainTabPaddingClass = "pb-[88px]";
