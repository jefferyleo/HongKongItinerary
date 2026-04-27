"use client";

import { useMemo, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useLocale, useTranslations } from "next-intl";
import type { Category, Place } from "@/lib/types";
import { MapBadge } from "./MapBadge";

const FILTERS: Array<{ key: "all" | Category; tKey: string }> = [
  { key: "all", tKey: "filterAll" },
  { key: "food", tKey: "filterFood" },
  { key: "drink", tKey: "filterDrink" },
  { key: "dessert", tKey: "filterDessert" },
  { key: "sight", tKey: "filterSight" },
];

export function PlacePool({
  places,
  scheduledIds,
  onAddPlace,
  onEditPlace,
}: {
  places: Place[];
  scheduledIds: Set<string>;
  onAddPlace?: () => void;
  onEditPlace?: (place: Place) => void;
}) {
  const t = useTranslations("pool");
  const tEdit = useTranslations("edit");
  const locale = useLocale();
  const [filter, setFilter] = useState<"all" | Category>("all");
  // Collapsed by default on mobile, expanded on desktop (controlled by CSS).
  const [openMobile, setOpenMobile] = useState(false);

  const unscheduled = useMemo(() => {
    return places.filter((p) => {
      if (scheduledIds.has(p.id)) return false;
      if (filter === "all") return true;
      return p.category === filter;
    });
  }, [places, scheduledIds, filter]);

  const { setNodeRef, isOver } = useDroppable({
    id: "pool",
    data: { type: "pool" },
  });

  return (
    <aside
      ref={setNodeRef}
      className={`glass p-4 sm:p-5 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] ${isOver ? "drop-target" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpenMobile((v) => !v)}
          className="text-left flex-1 min-w-0 lg:cursor-default lg:pointer-events-none"
          aria-expanded={openMobile}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.22em] t-faint">
              Drag to schedule
            </span>
            <span className="lg:hidden glass-pill mono-num text-[10px] px-1.5 py-0.5 t-mute">
              {unscheduled.length}
            </span>
          </div>
          <h2 className="text-base font-semibold mt-0.5 tracking-tight flex items-center gap-2">
            {t("title")}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className={`lg:hidden t-faint transition-transform ${openMobile ? "rotate-180" : ""}`}
              aria-hidden
            >
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </h2>
        </button>
        {onAddPlace && (
          <button
            type="button"
            onClick={onAddPlace}
            title={tEdit("addPlace")}
            aria-label={tEdit("addPlace")}
            className="rounded-full p-1.5 bg-[#14161b] text-white hover:bg-black transition shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>

      <div className={`${openMobile ? "flex" : "hidden"} lg:flex flex-col gap-3 min-h-0`}>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition border
                ${filter === f.key
                  ? "bg-[#14161b] text-white border-[#14161b]"
                  : "bg-white/60 t-soft border-[var(--color-line)] hover:bg-white"
                }`}
            >
              {t(f.tKey)}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto pr-1 flex flex-col gap-2 -mr-2 max-h-[60vh] lg:max-h-none">
          {unscheduled.length === 0 && (
            <p className="text-sm t-faint italic py-6 text-center">{t("empty")}</p>
          )}
          {unscheduled.map((p) => (
            <PoolCard
              key={p.id}
              place={p}
              isZh={locale === "zh-HK"}
              onEdit={onEditPlace ? () => onEditPlace(p) : undefined}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function PoolCard({
  place,
  isZh,
  onEdit,
}: {
  place: Place;
  isZh: boolean;
  onEdit?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool-${place.id}`,
    data: { type: "pool-item", place },
  });
  const primary = isZh ? place.name_zh : place.name_en;
  const secondary = isZh ? place.name_en : place.name_zh;

  return (
    <div
      ref={setNodeRef}
      className={`glass-soft p-2.5 select-none transition relative group hover:shadow-[0_4px_14px_-6px_rgba(20,22,27,0.18)] ${
        isDragging ? "dragging" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <div className={`text-[13px] font-medium leading-tight tracking-tight ${isZh ? "zh" : ""}`}>
          {primary}
        </div>
        <div className={`text-[11px] t-mute leading-tight ${isZh ? "" : "zh"}`}>{secondary}</div>
        <div className="mt-1.5">
          <MapBadge place={place} />
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit place"
          className="absolute top-1.5 right-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition t-faint hover:text-[var(--color-ink)] p-1 rounded"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
            <path d="M11 2l3 3-9 9H2v-3l9-9z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
