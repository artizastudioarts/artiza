-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Adds the floating promotion ribbon (bottom-right corner on phone and laptop,
-- always visible, does not move). Edit it in Admin -> Content -> "Promotion ribbon".
-- Needs migration-page-content.sql (the site_content table) first.
--
-- The ribbon is OFF until you fill in "Big text" or "Short text".
-- To switch it off again, clear both fields. Create the matching discount
-- code in Admin -> Discounts; customers enter it on Stripe's checkout page.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('promo', 'badge', 'Big text on the ribbon, e.g. -15 %  (leave empty together with the short text to hide the ribbon)', 'text', '', '', 1),
  ('promo', 'text', 'Short text next to it, e.g. auf alle Bausätze', 'text', '', '', 2),
  ('promo', 'code', 'Discount code shown on the ribbon (optional; customers tap it to copy)', 'text', '', '', 3),
  ('promo', 'link', 'Page the short text links to (optional), e.g. /shop', 'text', '', '', 4)
on conflict do nothing;
