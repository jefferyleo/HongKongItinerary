"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import type { ItineraryItem, Place } from "@/lib/types";
import { ItineraryCard } from "./ItineraryCard";

export function DayColumn({
  day,
  items,
  places,
  onRemove,
  onEdit,
  onAdd,
}: {
  day: number;
  items: ItineraryItem[];
  places: Map<string, Place>;
  onRemove?: (id: string) => void;
  onEdit?: (item: ItineraryItem) => void;
  onAdd?: () => void;
}) {
  const t = useTranslations("days");
  const tEdit = useTranslations("edit");
  const dKey = `day${day}` as const;
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: { type: "day", day },
  });

  return (
    <section
      ref={setNodeRef}
      className={`glass relative px-4 py-4 sm:px-8 sm:py-6 ${isOver ? "drop-target" : ""}`}
    >
      <header className="flex items-end justify-between gap-4 mb-5 pb-4 border-b border-[var(--color-line)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full day-bg-${day}`} aria-hidden />
            <span className={`text-[11px] uppercase tracking-[0.22em] day-accent-${day}`}>
              {t(`${dKey}.label`)}
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] t-faint">
              · {t(`${dKey}.date`)}
            </span>
          </div>
          <h2 className="mt-1.5 text-[19px] sm:text-[26px] font-semibold leading-tight tracking-tight">
            {t(`${dKey}.theme`)}
          </h2>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.18em] t-faint">Stops</div>
          <div className="mono-num text-2xl font-semibold leading-none mt-0.5">{items.length}</div>
        </div>
      </header>

      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-2.5">
          {items.map((it) => (
            <ItineraryCard
              key={it.id}
              item={it}
              place={it.place_id ? places.get(it.place_id) : undefined}
              day={day}
              onRemove={onRemove}
              onEdit={onEdit}
            />
          ))}
          {items.length === 0 && (
            <li className="text-sm t-faint italic px-2 py-12 text-center border border-dashed border-[var(--color-line)] rounded-xl">
              Drop something here
            </li>
          )}
        </ol>
      </SortableContext>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 w-full rounded-xl border border-dashed border-[var(--color-line)] bg-white/30 hover:bg-white/70 transition px-3 py-2.5 text-[13px] t-soft hover:text-[var(--color-ink)] flex items-center justify-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {tEdit("addStop")}
        </button>
      )}
    </section>
  );
}
