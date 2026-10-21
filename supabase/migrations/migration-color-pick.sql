-- Run this once in Supabase SQL Editor (staging first, then production).
-- Needs migration #44 (special colors) first.
--
-- "Pick your own colors": customers choose the paint colors for a product or for the
-- make-your-own box at the time of order. Up to 3 colors are free, every further color
-- costs 0,45 EUR (both numbers can be changed).
--   * Admin -> Color palette: the colors customers can choose from.
--   * Admin -> Products: switch it on per product (for example the letters & numbers set).
--   * Admin -> Custom box: free colors / price per extra color for the make-your-own box.

alter table special_colors
  add column if not exists kind text not null default 'glitter';

alter table products
  add column if not exists color_pick_enabled boolean not null default false,
  add column if not exists color_pick_free_count integer not null default 3,
  add column if not exists color_pick_extra_cents integer not null default 45;

alter table shipping_settings
  add column if not exists custom_box_color_free_count integer not null default 3,
  add column if not exists custom_box_color_extra_cents integer not null default 45;
