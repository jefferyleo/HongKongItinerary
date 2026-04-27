"use client";

import { useTranslations } from "next-intl";
import type { Place } from "@/lib/types";

export function MapBadge({ place }: { place: Place }) {
  const t = useTranslations("card");
  if (!place.mrt_zh && !place.mrt_en) return null;
  return (
    <span className="glass-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px]">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeOpacity=".55" />
        <circle cx="6" cy="6" r="1.6" fill="currentColor" fillOpacity=".55" />
      </svg>
      {place.mrt_zh && <span className="zh font-medium text-[var(--color-ink)]">{place.mrt_zh}</span>}
      {place.mrt_en && <span className="t-mute">{place.mrt_en}</span>}
      {place.exit && (
        <span className="ml-0.5 mono-num">
          · {t("exit")} {place.exit}
        </span>
      )}
    </span>
  );
}
