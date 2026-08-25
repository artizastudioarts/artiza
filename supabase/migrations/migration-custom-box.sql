-- Run this once in Supabase SQL Editor.
--
-- Adds the "Build Your Own Box" feature: admin-managed categories, each
-- holding any number of priced articles. Customers assemble their own
-- box from a single page, picking a quantity per article (or adding a
-- whole category at once). Shipping for a custom box is a flat fee
-- (not weight-based, unlike regular products), and a box must meet a
-- minimum order value to be added to the cart.

create table custom_box_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table custom_box_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references custom_box_categories(id) on delete cascade,
  label text not null,
  label_en text,
  price_cents integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index custom_box_articles_category_id_idx on custom_box_articles (category_id);

-- Public needs to read these to build the box on the storefront —
-- same pattern as the products table.
alter table custom_box_categories enable row level security;
create policy "Public can view custom box categories" on custom_box_categories
  for select using (true);

alter table custom_box_articles enable row level security;
create policy "Public can view custom box articles" on custom_box_articles
  for select using (true);

-- Flat shipping fee per box (not weight-based) and the minimum box
-- value required before it can be added to the cart.
alter table shipping_settings add column custom_box_shipping_cents integer not null default 500;
alter table shipping_settings add column custom_box_min_order_cents integer not null default 2000;

-- Orders: a custom box order has no single product_id, so it's flagged
-- and carries its own resolved contents + the customer's free-text
-- order notes, frozen at checkout time (same reasoning as custom_text
-- and variation_label — admin can rename/delete articles later without
-- altering what a past order actually shows).
alter table orders add column order_type text not null default 'standard';
alter table orders add constraint orders_order_type_check
  check (order_type in ('standard', 'custom_box'));
alter table orders add column custom_box_items jsonb;
alter table orders add column custom_box_notes text;
