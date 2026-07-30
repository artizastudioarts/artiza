-- Run this once in Supabase SQL Editor to switch from "one-of-a-kind / sold"
-- to "stock quantity per model" (e.g. POP figure models with multiple units).

alter table products add column stock_quantity integer not null default 0;

-- If you had pieces already marked sold/not sold, this gives sold-out items
-- 0 stock and everything else 1 stock as a starting point — go update the
-- real counts per model afterward in /admin.
update products set stock_quantity = case when is_sold then 0 else 1 end;

alter table products drop column is_sold;

-- Orders now need to record how many units were bought, not just which product
alter table orders add column quantity integer not null default 1;
