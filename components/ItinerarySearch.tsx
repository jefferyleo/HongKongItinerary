"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ItineraryItem, Place } from "@/lib/types";

type Match = {
  item: ItineraryItem;
  place?: Place;
  label: string;
  sub?: string;
};

export function ItinerarySearch({
  items,
  placeMap,
  onJump,
}: {
  items: ItineraryItem[];
  placeMap: Map<string, Place>;
  onJump: (day: number, itemId: string) => void;
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const isZh = locale === "zh-HK";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const matches = useMemo<Match[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: Match[] = [];
    for (const it of items) {
      const place = it.place_id ? placeMap.get(it.place_id) : undefined;
      const fields = [
        place?.name_en,
        place?.name_zh,
        place?.description_en,
        place?.description_zh,
        place?.address,
        it.custom_title_en,
        it.custom_title_zh,
        it.custom_note_en,
        it.custom_note_zh,
      ].filter(Boolean) as string[];
      if (!fields.some((f) => f.toLowerCase().includes(needle))) continue;
      const label =
        (isZh ? place?.name_zh : place?.name_en) ||
        place?.name_en ||
        place?.name_zh ||
        (isZh ? it.custom_title_zh : it.custom_title_en) ||
        it.custom_title_en ||
        it.custom_title_zh ||
        "—";
      const sub =
        (isZh ? place?.name_en : place?.name_zh) ||
        (isZh ? it.custom_title_en : it.custom_title_zh) ||
        undefined;
      out.push({ item: it, place, label, sub });
    }
    out.sort((a, b) => a.item.day - b.item.day || a.item.position - b.item.position);
    return out.slice(0, 12);
  }, [q, items, placeMap, isZh]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="glass-pill flex items-center gap-2 px-3 py-1.5">
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden className="t-faint">
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("placeholder")}
          className="bg-transparent outline-none text-[12px] w-44 sm:w-56 placeholder:t-faint"
          aria-label={t("placeholder")}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setOpen(false);
            }}
            aria-label={t("clear")}
            className="t-faint hover:text-[var(--color-ink)] transition"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="glass absolute right-0 mt-1.5 w-80 max-w-[90vw] z-30 p-1.5 max-h-[60vh] overflow-y-auto">
          {matches.length === 0 ? (
            <p className="text-[12px] t-faint italic px-2 py-3 text-center">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {matches.map((m) => (
                <li key={m.item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onJump(m.item.day, m.item.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/70 transition flex items-start gap-2"
                  >
                    <span
                      className={`day-bg-${m.item.day} day-accent-${m.item.day} mono-num text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5`}
                    >
                      D{m.item.day}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight truncate">{m.label}</span>
                      {m.sub && <span className="block text-[11px] t-mute leading-tight truncate">{m.sub}</span>}
                      {m.item.time_hint && (
                        <span className="mono-num text-[10px] t-faint">{m.item.time_hint}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
