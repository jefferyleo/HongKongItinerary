"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function DayTabs({
  activeDay,
  onChange,
  counts,
}: {
  activeDay: number;
  onChange: (day: number) => void;
  counts: Record<number, number>;
}) {
  const t = useTranslations("days");
  return (
    <nav
      role="tablist"
      aria-label="Days"
      className="glass grid grid-cols-4 sm:flex sm:flex-wrap items-stretch p-1.5 gap-1"
    >
      {DAYS.map((d) => (
        <DayTabButton
          key={d}
          day={d}
          active={activeDay === d}
          onClick={() => onChange(d)}
          label={t(`day${d}.label`)}
          date={t(`day${d}.date`)}
          count={counts[d] ?? 0}
        />
      ))}
    </nav>
  );
}

function DayTabButton({
  day,
  active,
  onClick,
  label,
  date,
  count,
}: {
  day: number;
  active: boolean;
  onClick: () => void;
  label: string;
  date: string;
  count: number;
}) {
  // Make each tab a drop target — drop on a tab to move a card to that day.
  const { setNodeRef, isOver } = useDroppable({
    id: `tab-${day}`,
    data: { type: "day", day },
  });

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`sm:flex-1 sm:min-w-[90px] rounded-2xl px-2.5 sm:px-3 py-2 text-left transition relative
        ${active
          ? "bg-[#14161b] text-white shadow-[0_4px_12px_-4px_rgba(20,22,27,0.35)]"
          : "hover:bg-white/60 text-[var(--color-ink-soft)]"
        }
        ${isOver ? "ring-2 ring-[#14161b]/40" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full day-bg-${day}`} aria-hidden />
        <span className="text-[11px] uppercase tracking-[0.16em] opacity-80">
          {label}
        </span>
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] mono-num">{date}</span>
        <span className={`text-[11px] mono-num ${active ? "opacity-60" : "t-faint"}`}>
          {count}
        </span>
      </div>
    </button>
  );
}
