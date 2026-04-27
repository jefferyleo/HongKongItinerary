import { setRequestLocale, getTranslations } from "next-intl/server";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ItineraryBoard } from "@/components/ItineraryBoard";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8 py-6 sm:py-10">
      <header className="flex items-start justify-between gap-3 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.32em] t-faint mono-num">
            12 — 18 · 06 · 2026
          </p>
          <h1 className="mt-1.5 sm:mt-2 text-[26px] sm:text-[34px] md:text-[44px] font-semibold leading-[1.05] tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="mt-1.5 sm:mt-2 t-mute text-[12px] sm:text-[14px]">{t("subtitle")}</p>
        </div>
        <LanguageToggle />
      </header>

      <ItineraryBoard />

      <footer className="mt-12 sm:mt-16 pt-5 sm:pt-6 border-t border-[var(--color-line)] text-center text-[10px] sm:text-[11px] t-faint">
        Next.js · dnd-kit · Supabase · next-intl
      </footer>
    </div>
  );
}
