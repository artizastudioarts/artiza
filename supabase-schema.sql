-- Run this once in your Supabase project: SQL Editor -> New Query -> paste -> Run

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_note text,
  medium text,
  dimensions text,
  price_cents integer not null,
  currency text not null default 'eur',
  image_url text,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

create sequence order_number_seq;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default
    ('AS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0')),
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

alter table orders enable row level security;
-- Guest orders (user_id is null) stay accessible only via the service role
-- key (used server-side in the webhook and admin dashboard). Logged-in
-- customers can additionally read their own orders:
create policy "Customers can view their own orders" on orders
  for select using (auth.uid() = user_id);

-- Single-row table holding the marketing homepage's editable content
create table home_content (
  id integer primary key default 1,
  headline text not null default 'Handmade with care, painted by you',
  subheadline text not null default 'PAINT-YOUR-OWN FIGURE KITS FOR KIDS',
  body text not null default 'We design and hand-finish every figure model before it ships to your door as a paint-it-yourself kit. Watch how each piece comes together, then browse the shop to pick one for your own little artist.',
  video_url text,
  constraint single_row check (id = 1)
);
insert into home_content (id) values (1);
alter table home_content enable row level security;
create policy "Public can view home content" on home_content
  for select using (true);
