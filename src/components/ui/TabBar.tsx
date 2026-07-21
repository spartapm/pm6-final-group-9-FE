"use client";

type Tab = { id: string; label: string; badge?: string };

type TabBarProps = {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
};

export function TabBar({ tabs, activeId, onChange }: TabBarProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeId);

  return (
    <div className="relative">
      <div className="flex">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 pb-3 pt-4 text-[15px] font-bold tracking-[-0.5px] transition ${
                active
                  ? "text-[var(--color-text-body)]"
                  : "text-[var(--color-text-body)] opacity-50"
              }`}
            >
              {tab.badge ? (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[14px] font-bold text-[var(--color-accent)]">
                  {tab.badge}
                </span>
              ) : null}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="relative h-0.5">
        <div className="absolute inset-y-0 left-7 right-7 bg-[var(--color-border-tab)]" />
        <span
          className="absolute top-0 h-0.5 bg-black transition-all duration-200"
          style={{
            width: `${100 / tabs.length}%`,
            left: `${(100 / tabs.length) * activeIndex}%`,
          }}
        />
      </div>
    </div>
  );
}
