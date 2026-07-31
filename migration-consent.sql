-- Run this once in Supabase SQL Editor to store the two checkout
-- checkboxes: marketing opt-in and terms-of-service acceptance.
alter table orders add column marketing_opt_in boolean not null default false;
alter table orders add column terms_accepted boolean not null default false;
