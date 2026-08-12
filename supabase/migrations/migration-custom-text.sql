-- Run this once in Supabase SQL Editor.
--
-- Adds support for a per-product "custom text" field at checkout (e.g.
-- letter-mold products where the customer specifies a name or word).
-- Toggled per product in Admin -> Artwork, with an admin-configurable
-- character limit to keep it from being abused for spam.

alter table products add column custom_text_enabled boolean not null default false;
alter table products add column custom_text_max_length integer default 30;
alter table products add column custom_text_label text;
alter table products add column custom_text_label_en text;

alter table orders add column custom_text text;

-- Custom text (and cart contents generally) can't safely travel through
-- Stripe's own metadata — each metadata value is capped at 500
-- characters, which arbitrary customer-typed text plus multiple cart
-- items could easily exceed. Instead, the full cart is staged here right
-- before checkout, and only a short reference id is passed to Stripe.
-- The webhook reads the real cart back from this table once payment
-- completes, then deletes the row.
create table pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  cart_items jsonb not null,
  created_at timestamptz not null default now()
);
alter table pending_checkouts enable row level security;
-- No public policies — only ever touched by our own server-side checkout
-- and webhook code via the service-role key.
