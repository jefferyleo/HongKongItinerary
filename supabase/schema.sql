-- Run this once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/kgrrvgivgvyjmcegncse/sql

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
);

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
);

alter table places enable row level security;
alter table itinerary_items enable row level security;

-- Single permissive ALL policy per table — this is a private personal project.
drop policy if exists anon_all on places;
create policy anon_all on places
  for all to anon
  using (true) with check (true);

drop policy if exists anon_all on itinerary_items;
create policy anon_all on itinerary_items
  for all to anon
  using (true) with check (true);
