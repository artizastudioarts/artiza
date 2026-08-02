-- Run this once in Supabase SQL Editor.
--
-- This creates a generic table for translatable page text. Each row is one
-- piece of text (like "the homepage headline") with a German and an
-- English version side by side. The admin dashboard's new "Content" tab
-- reads and writes this table directly — no code changes needed to edit
-- text for pages that already use it.
create table site_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  field_key text not null,
  label text not null,
  field_type text not null default 'text', -- 'text' or 'textarea'
  value_de text,
  value_en text,
  sort_order integer not null default 0,
  unique (page_key, field_key)
);

-- Seed the three homepage text fields, carrying over whatever was already
-- saved in home_content (assumed to be German, since that was the only
-- language before now) as the German version. The English version starts
-- empty, which just means the site falls back to its built-in English
-- default text until you fill it in.
insert into site_content (page_key, field_key, label, field_type, value_de, sort_order) values
  ('home', 'subheadline', 'Small label above the headline', 'text', (select subheadline from home_content where id = 1), 1),
  ('home', 'headline', 'Headline', 'text', (select headline from home_content where id = 1), 2),
  ('home', 'body', 'Body text', 'textarea', (select body from home_content where id = 1), 3)
on conflict (page_key, field_key) do nothing;

-- These three now live in site_content instead — home_content only keeps
-- the video going forward.
alter table home_content drop column if exists headline;
alter table home_content drop column if exists subheadline;
alter table home_content drop column if exists body;

-- Let the storefront (not just the admin dashboard) read this text.
alter table site_content enable row level security;
create policy "Public can view site content" on site_content
  for select using (true);
