-- Run this once in Supabase SQL Editor.
--
-- Stores the three email templates your admin dashboard's new "Emails"
-- tab lets you edit. Each has a subject and an HTML body containing
-- {{placeholders}} that get filled in automatically when an email is sent.
create table email_templates (
  key text primary key,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

-- No public policies on purpose — these are internal templates, only
-- ever read or written via the admin dashboard's service-role key, which
-- bypasses RLS regardless. This just makes sure the public anon key
-- (used by the storefront) can never read or touch this table.
alter table email_templates enable row level security;

insert into email_templates (key, subject, body) values
(
  'order_confirmation',
  'Deine Bestellung bei Artiza Studio ({{order_numbers}})',
  '<p>Hallo {{customer_name}},</p>
<p>vielen Dank für deine Bestellung bei Artiza Studio! Wir haben sie erhalten und machen uns bald an die Verpackung.</p>
{{items}}
<p><strong>Gesamt: {{total}}</strong></p>
<p>Du kannst den Status deiner Bestellung jederzeit über dein Konto auf unserer Website einsehen.</p>
<p>Herzliche Grüße,<br>Artiza Studio</p>'
),
(
  'order_status_changed',
  'Update zu deiner Bestellung {{order_number}}',
  '<p>Hallo {{customer_name}},</p>
<p>der Status deiner Bestellung <strong>{{order_number}}</strong> hat sich geändert:</p>
<p style="font-size:18px"><strong>{{status}}</strong></p>
{{items}}
<p>Herzliche Grüße,<br>Artiza Studio</p>'
),
(
  'abandoned_cart',
  'Du hast noch etwas im Warenkorb vergessen',
  '<p>Hallo,</p>
<p>uns ist aufgefallen, dass du diese Stücke in deinem Warenkorb hattest, den Kauf aber noch nicht abgeschlossen hast:</p>
{{items}}
<p>Falls du noch Fragen hast, antworte einfach auf diese E-Mail — wir helfen gerne weiter.</p>
<p>Herzliche Grüße,<br>Artiza Studio</p>'
);
