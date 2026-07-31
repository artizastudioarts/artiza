-- Run this once in Supabase SQL Editor to let each product have more
-- than one photo. The existing "image_url" column keeps working as the
-- main/cover photo; this adds a list of every photo for that product
-- (the gallery), including the cover photo as the first one.
alter table products add column image_urls text[] not null default '{}';
