import Link from "next/link";
import { FigmaImage } from "@/components/ui/FigmaImage";

function HeaderLogo() {
  return (
    <Link href="/home" aria-label="GUGU LETTER 홈" className="inline-flex items-center">
      <FigmaImage
        src="/images/logo-gugu-letter-header.png"
        alt="GUGU LETTER"
        width={160}
        height={17}
        className="h-[17px] w-auto object-contain"
      />
    </Link>
  );
}

type AppHeaderProps = {
  showLogo?: boolean;
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;
  title?: string;
  settingsHref?: string;
  rightSlot?: React.ReactNode;
  variant?: "default" | "splash" | "content";
  centered?: boolean;
};

export function AppHeader({
  showLogo = false,
  backHref,
  backLabel = "뒤로",
  onBack,
  title,
  settingsHref,
  rightSlot,
  variant = "default",
  centered = false,
}: AppHeaderProps) {
  const isSplash = variant === "splash";
  const isContent = variant === "content";

  return (
    <header
      className={`sticky top-0 z-30 flex min-h-14 shrink-0 items-center px-5 pt-[env(safe-area-inset-top)] ${
        isSplash
          ? "bg-transparent"
          : isContent
            ? "bg-[var(--color-bg-content)]"
            : "bg-[var(--color-bg)]"
      } ${centered ? "justify-center" : "justify-between"}`}
    >
      {!centered ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center gap-1 text-[14px] font-semibold tracking-[-0.15px] text-black"
            >
              <FigmaImage
                src="/images/figma/icon-back-ios.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
              {backLabel || null}
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              className="flex shrink-0 items-center gap-1 text-[14px] font-semibold tracking-[-0.15px] text-black"
            >
              <FigmaImage
                src="/images/figma/icon-back-ios.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6"
              />
              {backLabel || null}
            </Link>
          ) : showLogo ? (
            <HeaderLogo />
          ) : (
            <span className="w-8" />
          )}
          {title ? (
            <h1 className="truncate text-base font-bold text-[var(--color-text)]">
              {title}
            </h1>
          ) : null}
        </div>
      ) : (
        <HeaderLogo />
      )}

      <div
        className={`flex shrink-0 items-center gap-1 ${
          centered ? "absolute right-5" : ""
        }`}
      >
        {rightSlot}
        {settingsHref ? (
          <Link
            href={settingsHref}
            className="flex h-9 w-9 items-center justify-center"
            aria-label="설정"
          >
            <FigmaImage
              src="/images/figma/icon-settings.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </Link>
        ) : null}
      </div>
    </header>
  );
}
