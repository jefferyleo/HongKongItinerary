"use client";

import { getSupabase } from "./supabase";
import type { ItineraryItem, Place } from "./types";
import seedItems from "@/data/itinerary.json";
import seedPlaces from "@/data/places.json";

const LOCAL_KEY = "hk-itinerary-v1";
const LOCAL_PLACES_KEY = "hk-places-v1";

export type CloudStatus = "cloud" | "local" | "error";

export function localPlaces(): Place[] {
  if (typeof window !== "undefined") {
    const cached = window.localStorage.getItem(LOCAL_PLACES_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as Place[];
      } catch {}
    }
  }
  return seedPlaces as Place[];
}

export function localSeed(): ItineraryItem[] {
  return (seedItems as Omit<ItineraryItem, "id">[]).map((it, i) => ({
    ...it,
    id: `seed-${i}`,
  }));
}

function cachePlaces(places: Place[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_PLACES_KEY, JSON.stringify(places));
  }
}

export async function loadItinerary(): Promise<{ items: ItineraryItem[]; source: CloudStatus }> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("itinerary_items")
      .select("*")
      .order("day", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      console.error("[supabase] loadItinerary failed:", error);
    } else {
      const cloudItems = (data ?? []) as ItineraryItem[];

      // Backfill any day that has zero rows in the cloud. Lets the user
      // selectively reset a day via `delete from itinerary_items where day = N`
      // and have it re-seed on next load.
      const presentDays = new Set(cloudItems.map((i) => i.day));
      const missingDays = [1, 2, 3, 4, 5, 6, 7].filter((d) => !presentDays.has(d));
      if (missingDays.length > 0) {
        const seed = localSeed();
        const toInsert = seed.filter((it) => missingDays.includes(it.day));
        if (toInsert.length > 0) {
          const { error: insErr } = await sb
            .from("itinerary_items")
            .upsert(toInsert, { onConflict: "id" });
          if (insErr) {
            console.error("[supabase] backfill day(s) failed:", missingDays, insErr);
          } else {
            console.info(
              `[supabase] backfilled ${toInsert.length} items for empty day(s):`,
              missingDays
            );
            cloudItems.push(...toInsert);
          }
        }
      }

      if (cloudItems.length > 0) {
        console.info(`[supabase] loaded ${cloudItems.length} itinerary items from cloud`);
        return { items: cloudItems, source: "cloud" };
      }
    }
  }

  if (typeof window !== "undefined") {
    const cached = window.localStorage.getItem(LOCAL_KEY);
    if (cached) {
      console.info("[supabase] using localStorage cache (cloud unavailable)");
      return { items: JSON.parse(cached) as ItineraryItem[], source: sb ? "error" : "local" };
    }
  }
  return { items: localSeed(), source: sb ? "error" : "local" };
}

export async function loadPlaces(): Promise<{ places: Place[]; source: CloudStatus }> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("places").select("*");
    if (error) {
      console.error("[supabase] loadPlaces failed:", error);
    } else {
      const cloudRows = (data ?? []) as Place[];
      const cloudIds = new Set(cloudRows.map((p) => p.id));
      // Backfill any places present in the bundled seed but missing from cloud
      // (e.g. after deleting a row to refresh its gmaps_query).
      const seed = seedPlaces as Place[];
      const missing = seed.filter((p) => !cloudIds.has(p.id));
      if (missing.length > 0) {
        const { error: insErr } = await sb
          .from("places")
          .upsert(missing, { onConflict: "id" });
        if (insErr) {
          console.error("[supabase] places backfill failed:", insErr);
        } else {
          console.info(`[supabase] backfilled ${missing.length} missing places`);
          cloudRows.push(...missing);
        }
      }
      if (cloudRows.length > 0) {
        console.info(`[supabase] loaded ${cloudRows.length} places from cloud`);
        cachePlaces(cloudRows);
        return { places: cloudRows, source: "cloud" };
      }
    }
  }
  return { places: localPlaces(), source: sb ? "error" : "local" };
}

export async function persistItinerary(items: ItineraryItem[]): Promise<CloudStatus> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }
  const sb = getSupabase();
  if (!sb) return "local";

  const rows = items.map((it) => ({
    id: it.id,
    day: it.day,
    position: it.position,
    slot: it.slot,
    time_hint: it.time_hint ?? null,
    place_id: it.place_id ?? null,
    custom_title_en: it.custom_title_en ?? null,
    custom_title_zh: it.custom_title_zh ?? null,
    custom_note_en: it.custom_note_en ?? null,
    custom_note_zh: it.custom_note_zh ?? null,
  }));
  const { error } = await sb.from("itinerary_items").upsert(rows, { onConflict: "id" });
  if (error) {
    console.error("[supabase] persistItinerary upsert failed:", error);
    return "error";
  }
  return "cloud";
}

export async function removeItem(id: string): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "local";
  const { error } = await sb.from("itinerary_items").delete().eq("id", id);
  if (error) {
    console.error("[supabase] removeItem failed:", error);
    return "error";
  }
  return "cloud";
}

export async function upsertPlace(
  place: Place,
  allPlaces: Place[]
): Promise<{ places: Place[]; source: CloudStatus }> {
  const next = (() => {
    const idx = allPlaces.findIndex((p) => p.id === place.id);
    if (idx === -1) return [...allPlaces, place];
    const copy = allPlaces.slice();
    copy[idx] = place;
    return copy;
  })();
  cachePlaces(next);
  const sb = getSupabase();
  if (!sb) return { places: next, source: "local" };
  const { error } = await sb.from("places").upsert(place, { onConflict: "id" });
  if (error) {
    console.error("[supabase] upsertPlace failed:", error);
    return { places: next, source: "error" };
  }
  return { places: next, source: "cloud" };
}

export async function deletePlace(
  id: string,
  allPlaces: Place[]
): Promise<{ places: Place[]; source: CloudStatus }> {
  const next = allPlaces.filter((p) => p.id !== id);
  cachePlaces(next);
  const sb = getSupabase();
  if (!sb) return { places: next, source: "local" };
  const { error } = await sb.from("places").delete().eq("id", id);
  if (error) {
    console.error("[supabase] deletePlace failed:", error);
    return { places: next, source: "error" };
  }
  return { places: next, source: "cloud" };
}

export function reindex(items: ItineraryItem[]): ItineraryItem[] {
  const byDay = new Map<number, ItineraryItem[]>();
  for (const it of items) {
    if (!byDay.has(it.day)) byDay.set(it.day, []);
    byDay.get(it.day)!.push(it);
  }
  const out: ItineraryItem[] = [];
  for (const [day, list] of byDay) {
    list.forEach((it, idx) => out.push({ ...it, day, position: idx + 1 }));
  }
  return out;
}

export function newPlaceId(): string {
  return `usr-place-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function newItemId(): string {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
