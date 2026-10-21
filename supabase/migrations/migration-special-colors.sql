-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Special add-on colors (e.g. glitter colors). You add them in Admin -> Special colors
-- (name in German and English, a swatch color, a price per color - 0,50 EUR by default,
-- and an on/off switch). Every product page then asks the customer whether they want
-- any of them; each chosen color is added to the price per set. Nothing shows on the
-- product pages until you add at least one active color.

create table if not exists special_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  hex text,
  price_cents integer not null default 50,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table special_colors enable row level security;
drop policy if exists "Public can view active special colors" on special_colors;
create policy "Public can view active special colors" on special_colors
  for select using (active = true);
