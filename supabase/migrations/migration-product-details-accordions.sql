-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Product page upgrade:
--  * Each variation (option) can now carry "What's in the box" text, a "Colors included"
--    text (German + English), a photo to show when selected, and a "preselected" flag.
--  * A standard "Materials used" text shown on every product page, edited in
--    Admin -> Content -> "Materials used (all product pages)". Clear it to hide the section.
-- Needs migration-page-content.sql (site_content) and the product variations table first.

alter table product_variations
  add column if not exists box_contents text,
  add column if not exists box_contents_en text,
  add column if not exists colors_included text,
  add column if not exists colors_included_en text,
  add column if not exists image_index integer,
  add column if not exists is_default boolean not null default false;

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('product_materials', 'text', 'Materials used (shown on every product page; leave empty to hide)', 'textarea',
    'Die Figuren werden aus Gips gegossen und von Hand gefertigt. Bitte ergänze hier die weiteren Materialien (Farben, Pinsel, Verpackung).',
    'The figures are cast from plaster and made by hand. Please add the other materials here (paints, brushes, packaging).', 1)
on conflict (page_key, field_key) do nothing;
