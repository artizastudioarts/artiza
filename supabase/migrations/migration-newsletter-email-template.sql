-- Run this once in Supabase SQL Editor.
--
-- Moves the newsletter welcome email (sent right after someone signs up)
-- into the same editable template system as your other emails, so it's
-- editable in Admin -> Emails instead of hardcoded. Matches your other
-- three templates: German only, no separate English version.

insert into email_templates (key, subject, body) values
(
  'newsletter_welcome',
  'Willkommen bei Artiza Studio',
  '<p>Danke für deine Anmeldung!</p>
<p>Nutze den Code <strong>{{code}}</strong> für 10&nbsp;% Rabatt auf deine erste Bestellung.</p>
<p style="font-size:12px;color:#888;margin-top:24px;">Du möchtest keine weiteren E-Mails erhalten? <a href="{{unsubscribe_url}}">Hier abmelden</a>.</p>'
)
on conflict (key) do nothing;
