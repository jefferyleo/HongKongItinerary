"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ItineraryItem, Place, SlotKey } from "@/lib/types";
import { MapBadge } from "./MapBadge";

const SLOT_ICON: Record<SlotKey, string> = {
  transit: "→", checkin: "◐", checkout: "◑", breakfast: "☼", brunch: "✦",
  lunch: "●", snack: "•", dinner: "◆", dessert: "❀", drinks: "❍",
  coffee: "○", activity: "✧", sightseeing: "▲", rest: "▢", event: "★", shopping: "◇",
};

export function ItineraryCard({
  item,
  place,
  day,
  onRemove,
  onEdit,
}: {
  item: ItineraryItem;
  place: Place | undefined;
  day: number;
  onRemove?: (id: string) => void;
  onEdit?: (item: ItineraryItem) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("card");
  const tSlot = useTranslations("slots");
  const [showMap, setShowMap] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", item },
  });

  const titleEn = place?.name_en ?? item.custom_title_en ?? "";
  const titleZh = place?.name_zh ?? item.custom_title_zh ?? "";
  const isZh = locale === "zh-HK";
  const primary = isZh ? titleZh || titleEn : titleEn || titleZh;
  const secondary = isZh ? titleEn : titleZh;
  const description = isZh
    ? place?.description_zh ?? item.custom_note_zh
    : place?.description_en ?? item.custom_note_en;
  const address = place?.address;
  // Prefer a curated gmaps_query when set (lets us pin a specific branch
  // when the postal address is ambiguous, e.g. multi-branch shops).
  const mapQuery = place?.gmaps_query || address;
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;
  const mapsEmbed = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;

  const isTransit = item.slot === "transit";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      id={`item-${item.id}`}
      style={style}
      className={`group relative ${isDragging ? "opacity-90" : ""}`}
    >
      <div
        className={`relative rounded-2xl px-4 py-3.5 transition
          ${isTransit
            ? "bg-white/40 border border-dashed border-[var(--color-line)]"
            : "glass-soft hover:shadow-[0_8px_24px_-12px_rgba(20,22,27,0.18)]"
          }
          ${isDragging ? "dragging" : ""}`}
      >
        {/* Day stripe accent */}
        {!isTransit && (
          <span
            className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full day-bg-${day} opacity-70`}
            aria-hidden
          />
        )}

        <div className="flex items-start gap-3 pl-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
            className="touch-none cursor-grab active:cursor-grabbing select-none px-0.5 py-0.5 -ml-1 t-faint hover:text-[var(--color-ink)] transition"
          >
            <svg width="12" height="18" viewBox="0 0 12 18" aria-hidden>
              <g fill="currentColor">
                <circle cx="3" cy="3" r="1.2" /><circle cx="9" cy="3" r="1.2" />
                <circle cx="3" cy="9" r="1.2" /><circle cx="9" cy="9" r="1.2" />
                <circle cx="3" cy="15" r="1.2" /><circle cx="9" cy="15" r="1.2" />
              </g>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="mono-num text-[13px] font-semibold tracking-tight">
                {item.time_hint ?? "—"}
              </span>
              <span className="t-faint text-[11px] uppercase tracking-[0.14em]">
                <span className={`day-accent-${day} mr-1`} aria-hidden>
                  {SLOT_ICON[item.slot] ?? "•"}
                </span>
                {tSlot(item.slot)}
              </span>
            </div>

            <h3 className={`mt-0.5 text-[15px] font-semibold leading-snug tracking-tight ${isZh ? "zh" : ""}`}>
              {primary || <span className="italic t-faint">Untitled</span>}
            </h3>
            {secondary && secondary !== primary && (
              <p className={`text-[13px] t-mute leading-tight ${isZh ? "" : "zh"}`}>{secondary}</p>
            )}
            {description && (
              <p className="mt-1 text-[13px] t-soft leading-snug">{description}</p>
            )}

            {place && (
              <div className="mt-2 flex items-center flex-wrap gap-1.5">
                <MapBadge place={place} />
                {place.hours && (
                  <span className="glass-pill px-2 py-0.5 text-[11px]">
                    {place.hours}
                  </span>
                )}
              </div>
            )}

            {(mapsEmbed || mapsHref) && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {mapsEmbed && (
                  <button
                    type="button"
                    onClick={() => setShowMap((v) => !v)}
                    className="glass-pill px-2.5 py-1 text-[11px] hover:bg-white"
                  >
                    {showMap ? t("hideMap") : t("showMap")}
                  </button>
                )}
                {mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-pill px-2.5 py-1 text-[11px] hover:bg-white"
                  >
                    {t("openInMaps")} ↗
                  </a>
                )}
              </div>
            )}

            {showMap && mapsEmbed && (
              <div className="mt-2 overflow-hidden rounded-xl border border-[var(--color-line)]">
                <iframe
                  src={mapsEmbed}
                  width="100%"
                  height="220"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0 }}
                  title={primary}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 lg:opacity-0 lg:group-hover:opacity-100 transition -mt-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label={t("edit")}
                title={t("edit")}
                className="t-faint hover:text-[var(--color-ink)] transition px-1 py-0.5 rounded"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <path d="M11 2l3 3-9 9H2v-3l9-9z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={t("remove")}
                title={t("remove")}
                className="t-faint hover:text-rose-500 transition px-1 py-0.5 rounded"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
