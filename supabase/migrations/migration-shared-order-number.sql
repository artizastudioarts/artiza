-- Run this once in Supabase SQL Editor.
--
-- Previously, buying two different products in one checkout created two
-- separate order numbers (one per product). This makes one order number
-- cover the whole checkout instead — much easier to track and reference.

-- A function the app calls once per checkout to get a single order
-- number, then reuses it for every product bought in that same order.
create or replace function generate_order_number() returns text
language sql
as $$
  select 'AS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- order_number can no longer be unique on its own, since multiple rows
-- (one per distinct product in an order) now intentionally share one.
alter table orders drop constraint if exists orders_order_number_unique;
alter table orders drop constraint if exists orders_order_number_key;

-- Keep lookups by order number fast even without the uniqueness rule.
create index if not exists orders_order_number_idx on orders (order_number);

-- Reviews still keep one review per order (not per product), which now
-- lines up even better with a single order number per purchase.
