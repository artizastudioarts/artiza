-- Run this once in Supabase SQL Editor.
--
-- Adds optional English versions of each product's text fields. The
-- original columns (title, medium, dimensions, artist_note) keep working
-- exactly as before — think of them as the "main" language you always
-- fill in. These new "_en" columns are only used when a customer is
-- viewing the site in English, and only if you've filled them in; if
-- left empty, English visitors simply see the original text.
alter table products add column title_en text;
alter table products add column medium_en text;
alter table products add column dimensions_en text;
alter table products add column artist_note_en text;
