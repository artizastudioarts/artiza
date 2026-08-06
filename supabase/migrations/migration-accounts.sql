-- Run this once in Supabase SQL Editor to add customer accounts and let
-- logged-in customers see their own past orders.
--
-- This uses Supabase's built-in "Authentication" system (email + password).
-- You don't need to create a users table yourself — Supabase already has
-- one internally (auth.users) and this just links orders to it.

-- Every order can optionally belong to a signed-in customer. Guest orders
-- (no account) simply leave this column empty.
alter table orders add column user_id uuid references auth.users(id);

-- Allow a logged-in customer to read (only) their own orders. Nobody can
-- read anyone else's orders, and nobody can read guest orders (user_id is
-- null) through this policy — those stay visible only via the admin
-- dashboard's service role key, same as before.
create policy "Customers can view their own orders" on orders
  for select using (auth.uid() = user_id);
