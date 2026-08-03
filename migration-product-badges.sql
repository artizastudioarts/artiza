-- Run this once in Supabase SQL Editor.
--
-- Adds an optional "ribbon" badge to a product (Best Seller, Artist's
-- Pick, etc.) — shown as a corner ribbon on the shop and product pages.
-- Only one badge per product; leave it unset for no ribbon.
alter table products add column badge text;
alter table products add constraint products_badge_check
  check (badge is null or badge in (
    'best_seller', 'artists_pick', 'trending', 'customer_favorite', 'new_creations'
  ));

-- Note: this does NOT remove the stock_quantity column or its data —
-- the site's code has simply stopped using it, so quantity is no longer
-- limited by stock. The column is harmless to leave in place; delete it
-- yourself later only if you're sure you'll never want it back.
