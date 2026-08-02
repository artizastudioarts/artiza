-- Run this once in Supabase SQL Editor.

create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- one review per order, and the proof of purchase
  customer_name text not null,
  rating integer, -- 1-5, optional
  review_text text not null,
  image_url text,
  status text not null default 'pending', -- pending | approved | featured | rejected
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

-- The public (storefront) can only ever see reviews you've actually
-- approved or chosen to feature — never pending or rejected ones.
create policy "Public can view approved reviews" on reviews
  for select using (status in ('approved', 'featured'));

-- New text fields for the homepage's reviews section, editable from the
-- admin dashboard's Content tab.
insert into site_content (page_key, field_key, label, field_type, sort_order) values
  ('home', 'reviewsEyebrow', 'Reviews section — small label above the heading', 'text', 8),
  ('home', 'reviewsHeading', 'Reviews section — heading', 'text', 9)
on conflict (page_key, field_key) do nothing;
