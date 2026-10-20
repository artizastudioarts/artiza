-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Double opt-in for the newsletter: a new signup is saved as "unconfirmed" and gets one
-- confirmation email. Only after the person clicks the link (and presses the confirm button)
-- are they on the list and sent the welcome email with the discount code.
-- confirmed_at is your proof of consent; unconfirmed signups are deleted after 7 days.
--
-- Existing subscribers are marked as confirmed at the moment you run this. If some of them
-- are only test addresses, delete them in Supabase (Table Editor -> newsletter_subscribers).
-- Needs migration-newsletter.sql and migration-newsletter-email-template.sql first.

alter table newsletter_subscribers
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirm_token uuid not null default gen_random_uuid(),
  add column if not exists confirmation_sent_at timestamptz;

update newsletter_subscribers
set confirmed_at = subscribed_at
where confirmed_at is null;

insert into email_templates (key, subject, body) values
(
  'newsletter_confirm',
  'Bitte bestätige deine Newsletter-Anmeldung',
  '<p>Hallo,</p>
<p>schön, dass du dabei sein möchtest! Bitte bestätige deine Anmeldung zum Newsletter von Artiza Studio mit einem Klick:</p>
<p><a href="{{confirm_url}}"><strong>Anmeldung bestätigen</strong></a></p>
<p>Direkt danach bekommst du deinen Willkommensrabatt per E-Mail.</p>
<p style="font-size:12px;color:#888;margin-top:24px;">Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail einfach. Ohne Bestätigung speichern wir deine Adresse nicht dauerhaft und senden dir nichts.</p>'
)
on conflict (key) do nothing;
