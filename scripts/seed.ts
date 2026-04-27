/**
 * One-off seeder. Run with: `npm run seed`
 * Reads SUPABASE_DB_URL from .env.local. Never imported by app code.
 */
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "node:process";

// Load .env.local manually (no extra deps).
import { readFileSync } from "node:fs";
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {}

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error("SUPABASE_DB_URL missing in .env.local");
  process.exit(1);
}

const sql = postgres(DB_URL, { ssl: "require" });

async function main() {
  console.log("→ Creating schema…");
  await sql`
    create table if not exists places (
      id text primary key,
      name_zh text not null,
      name_en text not null,
      category text not null,
      description_en text,
      description_zh text,
      address text,
      mrt_en text,
      mrt_zh text,
      exit text,
      hours text,
      gmaps_query text,
      citation text
    )
  `;
  await sql`
    create table if not exists itinerary_items (
      id text primary key,
      day int not null,
      position int not null,
      slot text not null,
      time_hint text,
      place_id text references places(id) on delete set null,
      custom_title_en text,
      custom_title_zh text,
      custom_note_en text,
      custom_note_zh text
    )
  `;
  await sql`alter table places enable row level security`;
  await sql`alter table itinerary_items enable row level security`;

  // Permissive policies for the personal anon key (private project).
  for (const table of ["places", "itinerary_items"]) {
    for (const op of ["select", "insert", "update", "delete"]) {
      try {
        await sql.unsafe(
          `drop policy if exists "anon_${op}" on ${table};
           create policy "anon_${op}" on ${table} for ${op} to anon using (true) with check (true);`
        );
      } catch (e) {
        console.warn(`Policy ${op} on ${table}:`, e);
      }
    }
  }

  console.log("→ Seeding places…");
  const placesPath = resolve(process.cwd(), "data/places.json");
  const places = JSON.parse(await readFile(placesPath, "utf8"));
  for (const p of places) {
    await sql`
      insert into places ${sql({
        id: p.id,
        name_zh: p.name_zh,
        name_en: p.name_en,
        category: p.category,
        description_en: p.description_en ?? null,
        description_zh: p.description_zh ?? null,
        address: p.address ?? null,
        mrt_en: p.mrt_en ?? null,
        mrt_zh: p.mrt_zh ?? null,
        exit: p.exit ?? null,
        hours: p.hours ?? null,
        gmaps_query: p.gmaps_query ?? null,
        citation: p.citation ?? null,
      })}
      on conflict (id) do update set
        name_zh = excluded.name_zh,
        name_en = excluded.name_en,
        category = excluded.category,
        description_en = excluded.description_en,
        description_zh = excluded.description_zh,
        address = excluded.address,
        mrt_en = excluded.mrt_en,
        mrt_zh = excluded.mrt_zh,
        exit = excluded.exit,
        hours = excluded.hours,
        gmaps_query = excluded.gmaps_query,
        citation = excluded.citation
    `;
  }

  console.log("→ Seeding itinerary…");
  const itinPath = resolve(process.cwd(), "data/itinerary.json");
  const items = JSON.parse(await readFile(itinPath, "utf8"));
  // Replace existing only if the table is empty — otherwise leave user edits.
  const [{ count }] = await sql`select count(*)::int as count from itinerary_items`;
  if (count === 0) {
    items.forEach((it: any, i: number) => (it.id = `seed-${i}`));
    for (const it of items) {
      await sql`
        insert into itinerary_items ${sql({
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
        })}
      `;
    }
    console.log(`  seeded ${items.length} itinerary items`);
  } else {
    console.log(`  itinerary_items has ${count} rows — left untouched`);
  }

  await sql.end();
  console.log("✓ done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
