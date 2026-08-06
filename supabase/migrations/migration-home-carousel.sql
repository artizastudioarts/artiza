-- Run this once in Supabase SQL Editor.

-- New translatable text fields for the homepage's "story" section (the
-- text below the video) and a small label above the new image carousel.
-- These show up automatically in the admin dashboard's Content tab.
insert into site_content (page_key, field_key, label, field_type, sort_order) values
  ('home', 'storyEyebrow', 'Story section — small label above the heading', 'text', 4),
  ('home', 'storyHeading', 'Story section — heading', 'text', 5),
  ('home', 'storyBody', 'Story section — paragraph', 'textarea', 6),
  ('home', 'carouselEyebrow', 'Gallery section — small label above the photos', 'text', 7)
on conflict (page_key, field_key) do nothing;

-- Photos shown in the scrolling gallery near the bottom of the homepage.
-- Captions are optional and separate per language.
create table home_carousel_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption_de text,
  caption_en text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table home_carousel_images enable row level security;
create policy "Public can view carousel images" on home_carousel_images
  for select using (true);
