import type { ReactNode } from "react";

type BottomBarProps = {
  children: ReactNode;
};

export function BottomActionBar({ children }: BottomBarProps) {
  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent px-5 pb-6 pt-10 [box-shadow:var(--shadow-float)]">
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
