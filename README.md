# 🇭🇰 Hong Kong 2026 — Liquid-Glass Itinerary

A personal, draggable, bilingual itinerary for a 7-day Hong Kong trip
(12 – 18 June 2026, MYS ⇄ HKG).

## ✨ Features
- **Liquid-glass UI** — frosted backdrop blur, color-tinted day cards, animated harbour-dusk gradient orbs.
- **Drag-and-drop everything** — reorder within a day, move stops between days, drag from the *Place Pool* to schedule, drag back to remove.
- **Bilingual** — full English / 繁體中文 (Cantonese-style) UI. Place cards show both names; MRT badges always bilingual.
- **Embedded Google Maps** per card + "Open in Maps" link. MRT station + exit shown as a pill.
- **Route-optimized 7-day seed** — places auto-grouped by neighborhood (Yau Ma Tei × Mong Kok, Central × Sheung Wan, etc.) so each day has minimal travel.
- **Supabase persistence** with localStorage fallback (offline draft mode).

## Run it
```bash
npm install
cp .env.local.example .env.local  # then fill in your real DB password
npm run seed                      # one-off: provisions Supabase tables + seed data
npm run dev                       # http://localhost:3000
```

If you skip Supabase, the app still runs entirely from the bundled seed + localStorage.

## Trip facts baked in
- Day 1 ASOT 2026 at AsiaWorld-Expo (19:00 – 03:00) · stay **Regala Skycity** (airport).
- Day 2 onward: **The Kowloon Hotel**, TST. Travel via **AEL → Kowloon Stn → free K1 shuttle bus** (with luggage).
- Day 7 flight 14:35 — Day 7 morning: K11 MUSEA, then Airport Express.
- Wed night = Happy Valley horse races; weekday-only show kept off the weekend.

## Stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · @dnd-kit · next-intl 4 · Supabase.

See [CLAUDE.md](./CLAUDE.md) for architecture + project notes.
