-- Run this once in Supabase SQL Editor.
--
-- Adds support for product variations: an optional dropdown of named
-- options on a product (e.g. "Mom + Dad", "Full Family of 5"), each with
-- its own price. Toggled per product in Admin -> Artwork. Unlimited
-- options per product, managed as a separate table rather than a fixed
-- set of columns.

alter table products add column variations_enabled boolean not null default false;

create table product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  label_en text,
  price_cents integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_variations_product_id_idx on product_variations (product_id);

-- Same public-read / service-role-write pattern as the products table.
alter table product_variations enable row level security;
create policy "Public can view product variations" on product_variations
  for select using (true);

-- The label is frozen onto the order at checkout time (same reasoning as
-- custom_text: if the admin later renames or deletes the variation, past
-- orders and invoices should still show what the customer actually
-- bought).
alter table orders add column variation_label text;
