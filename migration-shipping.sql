-- Run this once in Supabase SQL Editor.

-- Optional weight per product, used to calculate shipping automatically.
-- Falls back to 300g in code if left empty, so nothing breaks if you
-- haven't filled every product in yet.
alter table products add column weight_grams integer;

-- Weight-based price tiers, separately for Standard and Express shipping.
-- Leave max_weight_g empty on a tier to make it the open-ended top tier
-- (e.g. "5001g and up").
create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('standard', 'express')),
  min_weight_g integer not null,
  max_weight_g integer,
  price_cents integer not null,
  sort_order integer not null default 0
);
alter table shipping_rates enable row level security;
-- No public policy — only the checkout process (service role) and admin
-- dashboard need this; nothing here is customer-facing data.

-- Starting German small-parcel rates — a reasonable default, edit freely
-- in Admin → Shipping.
insert into shipping_rates (method, min_weight_g, max_weight_g, price_cents, sort_order) values
  ('standard', 0, 500, 399, 1),
  ('standard', 501, 2000, 549, 2),
  ('standard', 2001, 5000, 799, 3),
  ('standard', 5001, null, 1099, 4),
  ('express', 0, 500, 799, 1),
  ('express', 501, 2000, 999, 2),
  ('express', 2001, 5000, 1299, 3),
  ('express', 5001, null, 1599, 4);

-- Single-row settings: a free-Standard-shipping threshold. Express always
-- stays paid even above this amount — that's the usual convention (you're
-- paying for the free option's speed, not to have both speeds free).
create table shipping_settings (
  id integer primary key default 1,
  free_standard_threshold_cents integer, -- null = disabled, no free shipping
  constraint single_row check (id = 1)
);
insert into shipping_settings (id, free_standard_threshold_cents) values (1, 5000);
alter table shipping_settings enable row level security;

-- The shipping cost actually charged on an order (captured from Stripe at
-- checkout), so it can show up in order totals and emails.
alter table orders add column shipping_cents integer;
