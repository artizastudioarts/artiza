-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Legal text updates that go with the withdrawal button
-- (migration-withdrawal-button.sql):
--   1. Privacy Policy: new section 14 describing what is stored when a
--      customer declares a withdrawal through the "Vertrag widerrufen" page.
--   2. Right of withdrawal (Widerrufsbelehrung): adds a line telling customers
--      they can also withdraw online, with a link to the form.
--   3. Order confirmation email: adds a line with a link to the withdrawal
--      form and the Widerrufsbelehrung (uses {{withdrawal_url}} and
--      {{withdrawal_info_url}}, which the shop fills in with your SITE_URL,
--      so staging emails link to staging and live emails to live).
--
-- Nothing you have already edited is overwritten: the two updates only
-- append, and only if the line is not there yet, so running this twice is
-- harmless. Have a lawyer / IHK read the wording before launch.
-- Needs migration-privacy-policy.sql, migration-widerrufsbelehrung.sql and
-- migration-email-templates.sql first.

-- 1. Privacy Policy, section 14
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('privacy', 's14_heading', 'Section 14 — heading', 'text',
    '14. Widerrufsformular', '14. Withdrawal form', 30),
  ('privacy', 's14_body', 'Section 14 — body', 'textarea',
    'Wenn du über unser Formular „Vertrag widerrufen“ einen Widerruf erklärst, speichern wir deinen Namen, deine E-Mail-Adresse, die Bestellnummer, gegebenenfalls die betroffenen Artikel sowie den Zeitpunkt des Eingangs, um deinen Widerruf zu bearbeiten und dir den Eingang zu bestätigen. Die Bestätigung senden wir per E-Mail über unseren E-Mail-Dienstleister Resend. Rechtsgrundlage ist die Durchführung des Vertrags und die Erfüllung rechtlicher Pflichten (Art. 6 Abs. 1 lit. b und c DSGVO). Wir speichern diese Angaben, solange dies für die Abwicklung erforderlich ist und gesetzliche Aufbewahrungspflichten bestehen.',
    'If you declare a withdrawal through our “Withdraw from contract” form, we store your name, email address, order number, any items concerned, and the time we received it, in order to process your withdrawal and confirm receipt to you. We send the confirmation by email through our email provider, Resend. The legal basis is the performance of the contract and compliance with legal obligations (Art. 6(1)(b) and (c) GDPR). We keep this information for as long as it is needed to handle the withdrawal and statutory retention obligations apply.',
    31)
on conflict (page_key, field_key) do nothing;

-- 2. Widerrufsbelehrung: mention the online option (appended once)
update site_content
set
  value_de = value_de || '<br><br>Du kannst deinen Widerruf auch direkt online erklären: <a href="/vertrag-widerrufen">Vertrag widerrufen</a>. Wir bestätigen dir den Eingang per E-Mail.'
where page_key = 'widerruf' and field_key = 's1_body'
  and value_de is not null and value_de not like '%vertrag-widerrufen%';

update site_content
set
  value_en = value_en || '<br><br>You can also declare your withdrawal directly online: <a href="/vertrag-widerrufen">Withdraw from contract</a>. We will confirm receipt by email.'
where page_key = 'widerruf' and field_key = 's1_body'
  and value_en is not null and value_en not like '%vertrag-widerrufen%';

-- 3. Order confirmation email: link to the withdrawal form (appended once)
update email_templates
set body = body || '
<p style="font-size:12px;color:#888;margin-top:24px;">Du möchtest deine Bestellung widerrufen? Das geht jederzeit online über <a href="{{withdrawal_url}}">Vertrag widerrufen</a>. Unsere <a href="{{withdrawal_info_url}}">Widerrufsbelehrung</a> findest du auf unserer Website.</p>'
where key = 'order_confirmation' and body not like '%{{withdrawal_url}}%';
