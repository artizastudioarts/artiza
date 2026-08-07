-- Run this once in Supabase SQL Editor.
--
-- Two things happen here:
-- 1. Adds an "impressum" page-content group for the new /impressum page,
--    a legal requirement in Germany (§5 DDG) separate from Terms.
-- 2. Moves your Terms & Conditions text out of the site's fixed code and
--    into the same editable Content system your homepage already uses —
--    so both pages now show up in Admin -> Content, editable without a
--    code change. Your existing Terms wording is copied over exactly as
--    it was, so nothing changes visually until you choose to edit it.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('impressum', 'ownerName', 'Legal owner name (the real person behind the business)', 'text', null, null, 1),
  ('impressum', 'phone', 'Contact phone number', 'text', null, null, 2),
  ('impressum', 'email', 'Contact email', 'text', 'info@artizastudio.de', 'info@artizastudio.de', 3),
  ('impressum', 'vatId', 'USt-IdNr. (optional — leave blank if you don''t have one)', 'text', null, null, 4),
  ('impressum', 'disputeResolutionNote', 'Consumer dispute resolution statement (§36 VSBG)', 'textarea',
    'Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    'We are not obligated and not willing to participate in dispute resolution proceedings before a consumer arbitration board.',
    5)
on conflict (page_key, field_key) do nothing;

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('terms', 'eyebrow', 'Small label above the title', 'text', 'Rechtliches', 'Legal', 1),
  ('terms', 'title', 'Page title', 'text', 'Allgemeine Geschäftsbedingungen', 'Terms & Conditions', 2),
  ('terms', 's1_heading', 'Section 1 — heading', 'text', '1. Wer wir sind', '1. Who we are', 3),
  ('terms', 's1_body', 'Section 1 — body', 'textarea', 'Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die über diese Website bei Artiza Studio ("wir", "uns", "unser") aufgegeben werden. Mit der Aufgabe einer Bestellung erklärst du dich mit diesen Bedingungen einverstanden.', 'These Terms & Conditions govern all orders placed with Artiza Studio ("we", "us", "our") through this website. By placing an order, you agree to these terms.', 4),
  ('terms', 's2_heading', 'Section 2 — heading', 'text', '2. Bestellungen und Zahlung', '2. Orders and payment', 5),
  ('terms', 's2_body', 'Section 2 — body', 'textarea', 'Alle Preise werden in Euro (EUR) angezeigt und enthalten die geltende Mehrwertsteuer, sofern nicht anders angegeben. Die Zahlung wird zum Zeitpunkt der Bestellung sicher über Stripe abgewickelt. Wir speichern keine Kartendaten. Eine Bestellung gilt als bestätigt, sobald die Zahlung erfolgreich abgeschlossen wurde; du erhältst dann eine Bestätigung mit deiner eindeutigen Bestellnummer.', 'All prices are shown in Euros (EUR) and include applicable taxes unless stated otherwise. Payment is processed securely by Stripe at the time of checkout. We do not store your card details. An order is confirmed once payment has been successfully completed, at which point you will receive a confirmation with your unique order number.', 6),
  ('terms', 's3_heading', 'Section 3 — heading', 'text', '3. Konten', '3. Accounts', 7),
  ('terms', 's3_body', 'Section 3 — body', 'textarea', 'Du kannst als Gast oder mit einem Konto bestellen. Wenn du ein Konto erstellst, bist du dafür verantwortlich, deine Anmeldedaten sicher aufzubewahren und für alle Aktivitäten unter deinem Konto.', 'You may check out as a guest or create an account. If you create an account, you are responsible for keeping your login details secure and for all activity under your account.', 8),
  ('terms', 's4_heading', 'Section 4 — heading', 'text', '4. Versand', '4. Shipping', 9),
  ('terms', 's4_body', 'Section 4 — body', 'textarea', 'Wir bemühen uns, Bestellungen zügig zu verpacken und zu versenden. Geschätzte Lieferzeiten hängen von deinem Standort ab und dienen nur zur Orientierung; sie sind keine garantierten Liefertermine. Das Risiko des Verlusts und das Eigentum an den Artikeln gehen auf dich über, sobald die Bestellung an die von dir angegebene Lieferadresse geliefert wurde.', 'We aim to pack and ship orders promptly. Estimated delivery times depend on your location and are provided for guidance only; they are not guaranteed delivery dates. Risk of loss and title for items pass to you once the order is delivered to the shipping address you provided.', 10),
  ('terms', 's5_heading', 'Section 5 — heading', 'text', '5. Rückgabe und Erstattung', '5. Returns and refunds', 11),
  ('terms', 's5_body', 'Section 5 — body', 'textarea', 'Du kannst die meisten Artikel innerhalb von <strong>14 Tagen</strong> nach Erhalt deiner Bestellung gegen vollständige Erstattung zurückgeben, sofern der Artikel unbenutzt und in seiner Originalverpackung ist. Um eine Rückgabe zu starten, kontaktiere uns mit deiner Bestellnummer. Erstattungen erfolgen auf die ursprüngliche Zahlungsmethode, sobald wir den zurückgesendeten Artikel erhalten und geprüft haben. Die Kosten für die Rücksendung trägt der Kunde, es sei denn, der Artikel kam fehlerhaft oder falsch an.', 'You may return most items within <strong>14 days</strong> of receiving your order for a full refund, provided the item is unused and in its original condition and packaging. To start a return, contact us with your order number. Refunds are issued to your original payment method once we''ve received and inspected the returned item. Return shipping costs are the responsibility of the customer unless the item arrived faulty or incorrect.', 12),
  ('terms', 's6_heading', 'Section 6 — heading', 'text', '6. Stornierungen', '6. Cancellations', 13),
  ('terms', 's6_body', 'Section 6 — body', 'textarea', 'Du kannst eine Bestellung stornieren, bevor sie versendet wurde, indem du uns kontaktierst. Sobald eine Bestellung versendet wurde, gilt stattdessen das oben beschriebene Rückgabeverfahren.', 'You may cancel an order before it has shipped by contacting us. Once an order has shipped, the return process above applies instead.', 14),
  ('terms', 's7_heading', 'Section 7 — heading', 'text', '7. Werbliche Kommunikation', '7. Promotional communications', 15),
  ('terms', 's7_body', 'Section 7 — body', 'textarea', 'Wenn du dich beim Checkout dafür entscheidest, senden wir dir möglicherweise gelegentlich Newsletter, Angebote oder Updates per E-Mail. Du kannst dich jederzeit über den Link in einer solchen E-Mail abmelden.', 'If you opt in at checkout, we may send you occasional newsletters, offers, or updates by email. You can unsubscribe at any time using the link in any such email.', 16),
  ('terms', 's8_heading', 'Section 8 — heading', 'text', '8. Deine Daten', '8. Your information', 17),
  ('terms', 's8_body', 'Section 8 — body', 'textarea', 'Wir erheben die Informationen, die zur Bearbeitung und zum Versand deiner Bestellung erforderlich sind — wie Name, E-Mail, Telefonnummer und Lieferadresse — und geben sie nur an die Dienstleister weiter, die zur Erfüllung deiner Bestellung notwendig sind (z. B. unser Zahlungsdienstleister und Versanddienstleister).', 'We collect the information needed to process and ship your order — such as your name, email, phone number, and shipping address — and share it only with the service providers necessary to fulfil your order (such as our payment processor and delivery carriers).', 18),
  ('terms', 's9_heading', 'Section 9 — heading', 'text', '9. Änderungen dieser Bedingungen', '9. Changes to these terms', 19),
  ('terms', 's9_body', 'Section 9 — body', 'textarea', 'Wir können diese Allgemeinen Geschäftsbedingungen von Zeit zu Zeit aktualisieren. Es gilt jeweils die Fassung, die zum Zeitpunkt deiner Bestellung in Kraft war.', 'We may update these Terms & Conditions from time to time. The version in effect at the time you place an order is the one that applies to that order.', 20),
  ('terms', 's10_heading', 'Section 10 — heading', 'text', '10. Kontakt', '10. Contact', 21),
  ('terms', 's10_body', 'Section 10 — body', 'textarea', 'Fragen zu einer Bestellung oder diesen Bedingungen? Schreib uns an <a href="mailto:info@artizastudio.de">info@artizastudio.de</a>.', 'Questions about an order or these terms? Reach out to us at <a href="mailto:info@artizastudio.de">info@artizastudio.de</a>.', 22)
on conflict (page_key, field_key) do nothing;
