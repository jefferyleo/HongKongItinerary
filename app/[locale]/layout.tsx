import "../globals.css";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Hong Kong 2026 · Itinerary",
  description: "Liquid-glass itinerary for a 7-day Hong Kong trip · 12–18 June 2026",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fbfaf7",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+HK:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="orb" style={{ width: 460, height: 460, background: "#ffd1c2", left: "-8%", top: "-12%" }} />
        <div className="orb" style={{ width: 520, height: 520, background: "#ddd2ff", right: "-12%", top: "14%", animationDelay: "-7s" }} />
        <div className="orb" style={{ width: 600, height: 600, background: "#c9e1ff", left: "30%", bottom: "-22%", animationDelay: "-14s" }} />
        <NextIntlClientProvider>
          <main className="relative z-10">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
