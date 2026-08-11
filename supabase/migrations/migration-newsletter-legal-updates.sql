-- Run this once in Supabase SQL Editor.
--
-- Two things:
-- 1. Adds a new "Newsletter" section to the Privacy Policy, covering the
--    newsletter signup feature (data collected, legal basis, unsubscribe
--    right).
-- 2. Corrects the Terms & Conditions "Promotional communications" section
--    — it previously described signing up via a checkout checkbox, which
--    no longer exists. It now correctly describes the homepage newsletter
--    form.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('privacy', 's13_heading', 'Section 13 — heading', 'text', '13. Newsletter', '13. Newsletter', 28),
  ('privacy', 's13_body', 'Section 13 — body', 'textarea',
    'Wenn du dich für unseren Newsletter anmeldest, speichern wir deine E-Mail-Adresse, deine Sprachauswahl und den Zeitpunkt der Anmeldung, um dir den Newsletter sowie deinen Willkommensrabatt zuzusenden. Der Versand erfolgt über unseren E-Mail-Dienstleister Resend. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit über den Abmeldelink in jeder E-Mail widerrufen; deine Daten werden dann umgehend gelöscht.',
    'If you sign up for our newsletter, we store your email address, language preference, and signup date in order to send you the newsletter and your welcome discount. Delivery is handled by our email provider, Resend. The legal basis is your consent (Art. 6(1)(a) GDPR). You can withdraw your consent at any time via the unsubscribe link in any email; your data will then be deleted promptly.',
    28)
on conflict (page_key, field_key) do nothing;

update site_content
set
  value_de = 'Wenn du dich über unser Newsletter-Formular anmeldest, senden wir dir gelegentlich Newsletter, Angebote oder Updates per E-Mail. Du kannst dich jederzeit über den Abmeldelink in jeder E-Mail wieder abmelden.',
  value_en = 'If you sign up through our newsletter form, we may send you occasional newsletters, offers, or updates by email. You can unsubscribe at any time using the link in any email.'
where page_key = 'terms' and field_key = 's7_body';
