"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: string) => {
    if (next === locale) return;
    // Replace the leading /<locale>/ segment.
    const segments = pathname.split("/");
    if (routing.locales.includes(segments[1] as never)) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    router.push(segments.join("/") || `/${next}`);
  };

  return (
    <div className="glass-pill inline-flex p-1 text-sm shrink-0" role="group" aria-label={t("language")}>
      {routing.locales.map((loc) => {
        const active = loc === locale;
        const label = loc === "en" ? "EN" : "繁";
        const full = loc === "en" ? t("english") : t("cantonese");
        return (
          <button
            key={loc}
            onClick={() => switchTo(loc)}
            aria-pressed={active}
            title={full}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition text-[12px] ${
              active
                ? "bg-[#14161b] text-white shadow-sm"
                : "t-soft hover:text-[var(--color-ink)]"
            } ${loc === "zh-HK" ? "zh" : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
