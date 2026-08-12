-- Run this once in Supabase SQL Editor.
--
-- Adds the editable short message shown in the newsletter announcement
-- bar at the very top of the homepage — separate from the fuller
-- heading/body text further down the page, since this needs to be much
-- shorter to fit in a slim bar.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('home', 'newsletterBarText', 'Newsletter announcement bar — short message', 'text',
    '10 % Rabatt auf deine erste Bestellung — jetzt für den Newsletter anmelden',
    '10% off your first order — sign up for our newsletter',
    13)
on conflict (page_key, field_key) do nothing;
