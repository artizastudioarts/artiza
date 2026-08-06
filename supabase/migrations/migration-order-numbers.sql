-- Run this once in Supabase SQL Editor to add unique order numbers
-- (format: AS-YYMM-000001). Once assigned, a number is never reused,
-- even if the order is later cancelled.

-- 1. A counter that only ever increases. This is what guarantees no two
--    orders can ever end up with the same number.
create sequence if not exists order_number_seq;

-- 2. The new column (nullable for now, we'll fill it in next).
alter table orders add column order_number text;

-- 3. Give every existing order a number, oldest first, using the month
--    it was actually placed in.
with numbered as (
  select id, created_at, row_number() over (order by created_at asc) as rn
  from orders
)
update orders o
set order_number = 'AS-' || to_char(numbered.created_at, 'YYMM') || '-' || lpad(numbered.rn::text, 6, '0')
from numbered
where o.id = numbered.id;

-- 4. Move the counter forward so new orders continue after the ones we
--    just numbered above (never reusing a number).
select setval('order_number_seq', (select count(*) from orders));

-- 5. From now on, every new order gets a number automatically the moment
--    it's inserted — nothing in the app code has to generate it.
alter table orders alter column order_number set default
  ('AS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0'));

-- 6. Lock it down: every order must have a number, and no two can match.
alter table orders alter column order_number set not null;
alter table orders add constraint orders_order_number_unique unique (order_number);
