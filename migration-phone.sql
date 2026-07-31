-- Run this once in Supabase SQL Editor to store the customer's phone
-- number, collected on Stripe's checkout page, with each order.
alter table orders add column phone text;
