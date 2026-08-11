-- ⚠️ RUN THIS ONLY ONCE, ONLY ON YOUR REAL/LIVE SUPABASE PROJECT ⚠️
--
-- This is NOT a schema migration — it's a one-time cleanup script to wipe
-- test data before real customers start using the site. It permanently
-- deletes data. Do not run this on a database that has any real customer
-- orders in it.
--
-- What this does:
-- 1. Deletes all test orders and invoices (and their PDF files)
-- 2. Deletes all test reviews
-- 3. Restarts order/invoice/credit-note numbering back to 1
--
-- What this does NOT touch: your products, site content, shipping
-- settings, invoice business settings, or your admin password — none of
-- that is test data, all of it stays exactly as configured.

-- 1. Delete all order and invoice records
delete from invoices;
delete from orders;

-- 2. Delete test reviews
delete from reviews;

-- 3. Restart all three numbering sequences back to 1, so your first real
-- order/invoice starts clean
alter sequence order_number_seq restart with 1;
alter sequence invoice_number_seq restart with 1;
alter sequence credit_note_number_seq restart with 1;

-- Note: the invoice PDF files themselves (in the private "invoices"
-- storage bucket) can't be deleted via SQL — Supabase blocks direct
-- deletion of storage objects this way. Delete those manually instead:
-- Supabase dashboard -> Storage -> invoices bucket -> select all -> Delete.
