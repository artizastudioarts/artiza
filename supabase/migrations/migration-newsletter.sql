-- Run this once in Supabase SQL Editor.

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'de',
  subscribed_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;
-- No public select policy — signups go through the API route (service
-- role), and only admin needs to read this list back.

-- Editable homepage newsletter section — same admin Content system as
-- everything else. The code itself isn't translated (a coupon code is
-- language-agnostic), so value_de and value_en are seeded the same.
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('home', 'newsletterHeading', 'Newsletter section — heading', 'text',
    'Bleib auf dem Laufenden', 'Stay in the loop', 10),
  ('home', 'newsletterBody', 'Newsletter section — body', 'textarea',
    'Melde dich für unseren Newsletter an und erhalte 10 % Rabatt auf deine erste Bestellung.',
    'Sign up for our newsletter and get 10% off your first order.', 11),
  ('home', 'newsletterCode', 'Welcome discount code shown/emailed to new subscribers — must match a real code created in Admin -> Discounts', 'text',
    'WILLKOMMEN10', 'WILLKOMMEN10', 12)
on conflict (page_key, field_key) do nothing;
