-- Run this once in Supabase SQL Editor.
--
-- Adds a "per character" pricing mode for personalized products (e.g. a
-- letter-mold priced by how many characters the customer types, at a
-- fixed rate per character). Only meaningful on products that already
-- have custom_text_enabled = true.

alter table products add column custom_text_pricing_mode text not null default 'fixed'
  check (custom_text_pricing_mode in ('fixed', 'per_character'));
alter table products add column custom_text_price_per_char_cents integer;
alter table products add column custom_text_min_length integer;
