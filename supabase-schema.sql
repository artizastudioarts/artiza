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
  is_sold boolean not null default false,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  product_id uuid references products(id),
  product_title text,
  amount_total_cents integer,
  currency text,
  status text not null default 'paid', -- paid, shipped, cancelled
  created_at timestamptz not null default now()
);

-- Allow the public (anon key) to READ products only. Everything else stays
-- locked down to the service role key, which only your server code has.
alter table products enable row level security;
create policy "Public can view products" on products
  for select using (true);

alter table orders enable row level security;
-- no public policies on orders: only accessible via the service role key
-- (used server-side in the webhook and admin dashboard)
