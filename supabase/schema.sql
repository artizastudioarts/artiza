-- Run this once in your Supabase project: SQL Editor -> New Query -> paste -> Run

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_note text,
  medium text,
  dimensions text,
  title_en text,
  artist_note_en text,
  medium_en text,
  dimensions_en text,
  price_cents integer not null,
  currency text not null default 'eur',
  image_url text,
  image_urls text[] not null default '{}',
  badge text,
  created_at timestamptz not null default now(),
  constraint products_badge_check check (badge is null or badge in (
    'best_seller', 'artists_pick', 'trending', 'customer_favorite', 'new_creations'
  ))
);

create sequence order_number_seq;

create or replace function generate_order_number() returns text
language sql
as $$
  select 'AS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  -- Not unique: every product bought together in one checkout shares the
  -- same order_number, generated once via generate_order_number().
  order_number text not null default generate_order_number(),
  stripe_session_id text unique not null,
  customer_email text,
  customer_name text,
  phone text,
  shipping_address jsonb,
  product_id uuid references products(id),
  product_title text,
  quantity integer not null default 1,
  amount_total_cents integer,
  currency text,
  status text not null default 'paid', -- paid, shipped, cancelled
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) -- null for guest checkouts
);

-- Allow the public (anon key) to READ products only. Everything else stays
-- locked down to the service role key, which only your server code has.
alter table products enable row level security;
create policy "Public can view products" on products
  for select using (true);

create index orders_order_number_idx on orders (order_number);
alter table orders enable row level security;
-- Guest orders (user_id is null) stay accessible only via the service role
-- key (used server-side in the webhook and admin dashboard). Logged-in
-- customers can additionally read their own orders:
create policy "Customers can view their own orders" on orders
  for select using (auth.uid() = user_id);

-- Single-row table holding the marketing homepage's editable video
create table home_content (
  id integer primary key default 1,
  video_url text,
  constraint single_row check (id = 1)
);
insert into home_content (id) values (1);
alter table home_content enable row level security;
create policy "Public can view home content" on home_content
  for select using (true);

-- Generic bilingual text store for page content (see migration-page-content.sql
-- for a longer explanation). Extended with more rows whenever a new page
-- needs editable, translatable text.
create table site_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  value_de text,
  value_en text,
  sort_order integer not null default 0,
  unique (page_key, field_key)
);
insert into site_content (page_key, field_key, label, field_type, sort_order) values
  ('home', 'subheadline', 'Small label above the headline', 'text', 1),
  ('home', 'headline', 'Headline', 'text', 2),
  ('home', 'body', 'Body text', 'textarea', 3),
  ('home', 'storyEyebrow', 'Story section — small label above the heading', 'text', 4),
  ('home', 'storyHeading', 'Story section — heading', 'text', 5),
  ('home', 'storyBody', 'Story section — paragraph', 'textarea', 6),
  ('home', 'carouselEyebrow', 'Gallery section — small label above the photos', 'text', 7),
  ('home', 'reviewsEyebrow', 'Reviews section — small label above the heading', 'text', 8),
  ('home', 'reviewsHeading', 'Reviews section — heading', 'text', 9);
alter table site_content enable row level security;
create policy "Public can view site content" on site_content
  for select using (true);

-- Photos shown in the scrolling gallery near the bottom of the homepage
create table home_carousel_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption_de text,
  caption_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table home_carousel_images enable row level security;
create policy "Public can view carousel images" on home_carousel_images
  for select using (true);

-- Customer reviews, verified by order number
create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  rating integer,
  review_text text not null,
  image_url text,
  status text not null default 'pending', -- pending | approved | featured | rejected
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;
create policy "Public can view approved reviews" on reviews
  for select using (status in ('approved', 'featured'));

-- Admin-editable email templates (order confirmation, status updates,
-- abandoned cart). Not publicly readable — admin dashboard only.
create table email_templates (
  key text primary key,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);
-- No public policies on purpose — internal templates, admin-only via the
-- service-role key, which bypasses RLS regardless.
alter table email_templates enable row level security;
insert into email_templates (key, subject, body) values
(
  'order_confirmation',
  'Deine Bestellung bei Artiza Studio ({{order_numbers}})',
  '<p>Hallo {{customer_name}},</p>
<p>vielen Dank für deine Bestellung bei Artiza Studio! Wir haben sie erhalten und machen uns bald an die Verpackung.</p>
{{items}}
<p><strong>Gesamt: {{total}}</strong></p>
<p>Du kannst den Status deiner Bestellung jederzeit über dein Konto auf unserer Website einsehen.</p>
<p>Herzliche Grüße,<br>Artiza Studio</p>'
),
(
  'order_status_changed',
  'Update zu deiner Bestellung {{order_number}}',
  '<p>Hallo {{customer_name}},</p>
<p>der Status deiner Bestellung <strong>{{order_number}}</strong> hat sich geändert:</p>
<p style="font-size:18px"><strong>{{status}}</strong></p>
{{items}}
<p>Herzliche Grüße,<br>Artiza Studio</p>'
),
(
  'abandoned_cart',
  'Du hast noch etwas im Warenkorb vergessen',
  '<p>Hallo,</p>
<p>uns ist aufgefallen, dass du diese Stücke in deinem Warenkorb hattest, den Kauf aber noch nicht abgeschlossen hast:</p>
{{items}}
<p>Falls du noch Fragen hast, antworte einfach auf diese E-Mail — wir helfen gerne weiter.</p>
<p>Herzliche Grüße,<br>Artiza Studio</p>'
);

-- Optional weight per product, used to calculate shipping automatically
alter table products add column weight_grams integer;

-- Weight-based shipping price tiers (Standard / Express)
create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('standard', 'express')),
  min_weight_g integer not null,
  max_weight_g integer,
  price_cents integer not null,
  sort_order integer not null default 0
);
alter table shipping_rates enable row level security;
insert into shipping_rates (method, min_weight_g, max_weight_g, price_cents, sort_order) values
  ('standard', 0, 500, 399, 1),
  ('standard', 501, 2000, 549, 2),
  ('standard', 2001, 5000, 799, 3),
  ('standard', 5001, null, 1099, 4),
  ('express', 0, 500, 799, 1),
  ('express', 501, 2000, 999, 2),
  ('express', 2001, 5000, 1299, 3),
  ('express', 5001, null, 1599, 4);

-- Free-Standard-shipping threshold (Express always stays paid)
create table shipping_settings (
  id integer primary key default 1,
  free_standard_threshold_cents integer,
  constraint single_row check (id = 1)
);
insert into shipping_settings (id, free_standard_threshold_cents) values (1, 5000);
alter table shipping_settings enable row level security;

-- Shipping cost actually charged, captured from Stripe at checkout
alter table orders add column shipping_cents integer;
