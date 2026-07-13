import Image from "next/image";
import Link from "next/link";

function HeaderLogo() {
  return (
    <Link href="/home" aria-label="GUGU LETTER 홈">
      <Image
        src="/images/logo-gugu-letter.png"
        alt="GUGU LETTER"
        width={148}
        height={16}
        className="h-auto w-[148px]"
        priority
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
      className={`relative flex h-14 shrink-0 items-center px-5 ${
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
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12 4 6 10l6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {backLabel}
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12 4 6 10l6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {backLabel}
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
            <Image
              src="/images/icon-settings.png"
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
