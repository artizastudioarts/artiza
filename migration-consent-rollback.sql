-- Only needed if you already ran migration-consent.sql in Supabase.
-- Run this in the SQL Editor to remove those two columns again.
-- Safe to run even if they don't exist — it just does nothing in that case.
alter table orders drop column if exists marketing_opt_in;
alter table orders drop column if exists terms_accepted;
