-- Run this once in your Supabase project: SQL Editor -> New Query -> paste -> Run

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist_note text,
  medium text,
  dimensions text,
  title_en text,
  artist_note_en text,
  medium_en text,
  dimensions_en text,
  price_cents integer not null,
  currency text not null default 'eur',
  image_url text,
  image_urls text[] not null default '{}',
  badge text,
  created_at timestamptz not null default now(),
  constraint products_badge_check check (badge is null or badge in (
    'best_seller', 'artists_pick', 'trending', 'customer_favorite', 'new_creations'
  ))
);

create sequence order_number_seq;

create or replace function generate_order_number() returns text
language sql
as $$
  select 'AS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

create table orders (
  id uuid primary key default gen_random_uuid(),
  -- Not unique: every product bought together in one checkout shares the
  -- same order_number, generated once via generate_order_number().
  order_number text not null default generate_order_number(),
  stripe_session_id text unique not null,
  customer_email text,
  customer_name text,
  phone text,
  shipping_address jsonb,
  product_id uuid references products(id),
  product_title text,
  quantity integer not null default 1,
  amount_total_cents integer,
  currency text,
  status text not null default 'paid', -- paid, shipped, cancelled
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) -- null for guest checkouts
);

-- Allow the public (anon key) to READ products only. Everything else stays
-- locked down to the service role key, which only your server code has.
alter table products enable row level security;
create policy "Public can view products" on products
  for select using (true);

create index orders_order_number_idx on orders (order_number);
alter table orders enable row level security;
-- Guest orders (user_id is null) stay accessible only via the service role
-- key (used server-side in the webhook and admin dashboard). Logged-in
-- customers can additionally read their own orders:
create policy "Customers can view their own orders" on orders
  for select using (auth.uid() = user_id);

-- Single-row table holding the marketing homepage's editable video
create table home_content (
  id integer primary key default 1,
  video_url text,
  constraint single_row check (id = 1)
);
insert into home_content (id) values (1);
alter table home_content enable row level security;
create policy "Public can view home content" on home_content
  for select using (true);

-- Generic bilingual text store for page content (see migration-page-content.sql
-- for a longer explanation). Extended with more rows whenever a new page
-- needs editable, translatable text.
create table site_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  field_key text not null,
  label text not null,
  field_type text not null default 'text',
  value_de text,
  value_en text,
  sort_order integer not null default 0,
  unique (page_key, field_key)
);
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('home', 'subheadline', 'Small label above the headline', 'text', null, null, 1),
  ('home', 'headline', 'Headline', 'text', null, null, 2),
  ('home', 'body', 'Body text', 'textarea', null, null, 3),
  ('home', 'storyEyebrow', 'Story section — small label above the heading', 'text', null, null, 4),
  ('home', 'storyHeading', 'Story section — heading', 'text', null, null, 5),
  ('home', 'storyBody', 'Story section — paragraph', 'textarea', null, null, 6),
  ('home', 'carouselEyebrow', 'Gallery section — small label above the photos', 'text', null, null, 7),
  ('home', 'reviewsEyebrow', 'Reviews section — small label above the heading', 'text', null, null, 8),
  ('home', 'reviewsHeading', 'Reviews section — heading', 'text', null, null, 9),
  ('impressum', 'ownerName', 'Legal owner name (the real person behind the business)', 'text', null, null, 1),
  ('impressum', 'phone', 'Contact phone number', 'text', null, null, 2),
  ('impressum', 'email', 'Contact email', 'text', 'info@artizastudio.de', 'info@artizastudio.de', 3),
  ('impressum', 'vatId', 'USt-IdNr. (optional — leave blank if you don''t have one)', 'text', null, null, 4),
  ('impressum', 'disputeResolutionNote', 'Consumer dispute resolution statement (§36 VSBG)', 'textarea',
    'Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    'We are not obligated and not willing to participate in dispute resolution proceedings before a consumer arbitration board.',
    5),
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
  ('terms', 's7_body', 'Section 7 — body', 'textarea', 'Wenn du dich über unser Newsletter-Formular anmeldest, senden wir dir gelegentlich Newsletter, Angebote oder Updates per E-Mail. Du kannst dich jederzeit über den Abmeldelink in jeder E-Mail wieder abmelden.', 'If you sign up through our newsletter form, we may send you occasional newsletters, offers, or updates by email. You can unsubscribe at any time using the link in any email.', 16),
  ('terms', 's8_heading', 'Section 8 — heading', 'text', '8. Deine Daten', '8. Your information', 17),
  ('terms', 's8_body', 'Section 8 — body', 'textarea', 'Wir erheben die Informationen, die zur Bearbeitung und zum Versand deiner Bestellung erforderlich sind — wie Name, E-Mail, Telefonnummer und Lieferadresse — und geben sie nur an die Dienstleister weiter, die zur Erfüllung deiner Bestellung notwendig sind (z. B. unser Zahlungsdienstleister und Versanddienstleister).', 'We collect the information needed to process and ship your order — such as your name, email, phone number, and shipping address — and share it only with the service providers necessary to fulfil your order (such as our payment processor and delivery carriers).', 18),
  ('terms', 's9_heading', 'Section 9 — heading', 'text', '9. Änderungen dieser Bedingungen', '9. Changes to these terms', 19),
  ('terms', 's9_body', 'Section 9 — body', 'textarea', 'Wir können diese Allgemeinen Geschäftsbedingungen von Zeit zu Zeit aktualisieren. Es gilt jeweils die Fassung, die zum Zeitpunkt deiner Bestellung in Kraft war.', 'We may update these Terms & Conditions from time to time. The version in effect at the time you place an order is the one that applies to that order.', 20),
  ('terms', 's10_heading', 'Section 10 — heading', 'text', '10. Kontakt', '10. Contact', 21),
  ('terms', 's10_body', 'Section 10 — body', 'textarea', 'Fragen zu einer Bestellung oder diesen Bedingungen? Schreib uns an <a href="mailto:info@artizastudio.de">info@artizastudio.de</a>.', 'Questions about an order or these terms? Reach out to us at <a href="mailto:info@artizastudio.de">info@artizastudio.de</a>.', 22),
  ('faq', 'eyebrow', 'Small label above the title', 'text', 'Häufige Fragen', 'Common Questions', 1),
  ('faq', 'title', 'Page title', 'text', 'Fragen & Antworten', 'FAQ', 2),
  ('faq', 'q1_question', 'Question 1', 'text', 'Was ist in einem Set enthalten?', 'What''s included in a kit?', 3),
  ('faq', 'q1_answer', 'Answer 1', 'textarea', 'Jedes Set enthält die handgefertigte Figur sowie alles, was du zum Bemalen brauchst — Details findest du auf der jeweiligen Produktseite.', 'Each kit includes the hand-made figure along with everything you need to paint it — details are listed on each product page.', 4),
  ('faq', 'q2_question', 'Question 2', 'text', 'Wie lange dauert der Versand?', 'How long does shipping take?', 5),
  ('faq', 'q2_answer', 'Answer 2', 'textarea', 'Bestellungen werden in der Regel innerhalb weniger Werktage verpackt und versendet. Die genaue Lieferzeit hängt von der gewählten Versandart ab.', 'Orders are typically packed and shipped within a few business days. Exact delivery time depends on the shipping speed you choose.', 6),
  ('faq', 'q3_question', 'Question 3', 'text', 'Kann ich einen Artikel zurückgeben?', 'Can I return an item?', 7),
  ('faq', 'q3_answer', 'Answer 3', 'textarea', 'Ja — die meisten Artikel können innerhalb von 14 Tagen nach Erhalt zurückgegeben werden. Details findest du in unseren AGB.', 'Yes — most items can be returned within 14 days of receiving them. See our Terms & Conditions for details.', 8),
  ('faq', 'q4_question', 'Question 4', 'text', 'Welche Farben und Materialien werden verwendet?', 'What paints and materials are used?', 9),
  ('faq', 'q4_answer', 'Answer 4', 'textarea', 'Wir verwenden sorgfältig ausgewählte, hochwertige Farben. Bei Fragen zu einem bestimmten Produkt kontaktiere uns gerne.', 'We use carefully selected, good-quality paints. If you have questions about a specific product, feel free to reach out.', 10),
  ('faq', 'q5_question', 'Question 5', 'text', 'Wie kann ich meine Bestellung verfolgen?', 'How do I track my order?', 11),
  ('faq', 'q5_answer', 'Answer 5', 'textarea', 'Sobald du eingeloggt bestellst, findest du den Status deiner Bestellung jederzeit in deinem Konto. Als Gast erhältst du Updates per E-Mail.', 'If you order while logged in, you can check your order status anytime in your account. As a guest, you''ll get updates by email.', 12),
  ('faq', 'q6_question', 'Question 6', 'text', 'Versendet ihr auch außerhalb Deutschlands?', 'Do you ship outside Germany?', 13),
  ('faq', 'q6_answer', 'Answer 6', 'textarea', 'Aktuell versenden wir nur innerhalb Deutschlands. Schreib uns gerne, falls du Fragen zu einer Lieferung ins Ausland hast.', 'Right now we only ship within Germany. Feel free to reach out if you have questions about shipping abroad.', 14),
  ('contact', 'eyebrow', 'Small label above the title', 'text', 'Kontakt', 'Contact', 1),
  ('contact', 'title', 'Page title', 'text', 'Kontaktiere uns', 'Get in Touch', 2),
  ('contact', 'intro', 'Intro paragraph', 'textarea', 'Fragen zu einer Bestellung oder einem Produkt? Schreib uns eine Nachricht — wir melden uns so schnell wie möglich zurück.', 'Questions about an order or a product? Send us a message — we''ll get back to you as soon as we can.', 3),
  ('privacy', 'eyebrow', 'Small label above the title', 'text', 'Rechtliches', 'Legal', 1),
  ('privacy', 'title', 'Page title', 'text', 'Datenschutzerklärung', 'Privacy Policy', 2),
  ('privacy', 's1_heading', 'Section 1 — heading', 'text', '1. Verantwortlicher', '1. Data controller', 3),
  ('privacy', 's1_body', 'Section 1 — body', 'textarea', 'Verantwortlich für die Datenverarbeitung auf dieser Website ist der Betreiber von Artiza Studio. Die vollständigen Kontaktdaten findest du in unserem Impressum.', 'The operator of Artiza Studio is responsible for data processing on this website. Full contact details are available on our Legal Notice (Impressum) page.', 4),
  ('privacy', 's2_heading', 'Section 2 — heading', 'text', '2. Datenerfassung beim Hosting', '2. Data collected by our hosting provider', 5),
  ('privacy', 's2_body', 'Section 2 — body', 'textarea', 'Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf der Website erhebt unser Hosting-Anbieter automatisch technische Informationen (sogenannte Server-Logfiles), z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite und verwendeter Browser. Diese Daten sind technisch erforderlich, um dir die Website anzuzeigen, und werden nicht mit anderen Datenquellen zusammengeführt.', 'This website is hosted by Vercel Inc. When you visit the site, our hosting provider automatically collects technical information (server log files) such as IP address, date and time of access, the page requested, and browser used. This data is technically required to serve you the site and is not combined with other data sources.', 6),
  ('privacy', 's3_heading', 'Section 3 — heading', 'text', '3. Cookies', '3. Cookies', 7),
  ('privacy', 's3_body', 'Section 3 — body', 'textarea', 'Diese Website verwendet Cookies — sowohl technisch notwendige als auch optionale, die nur mit deiner Zustimmung aktiv werden. Details zu den einzelnen Cookies, ihrem Zweck und wie du deine Auswahl änderst, findest du in unserer <a href="/cookies">Cookie-Richtlinie</a>.', 'This website uses cookies — both technically necessary ones and optional ones that only activate with your consent. For details on individual cookies, their purpose, and how to change your preferences, see our <a href="/cookies">Cookie Policy</a>.', 8),
  ('privacy', 's4_heading', 'Section 4 — heading', 'text', '4. Kontaktformular', '4. Contact form', 9),
  ('privacy', 's4_body', 'Section 4 — body', 'textarea', 'Wenn du uns über das Kontaktformular schreibst, verarbeiten wir die von dir angegebenen Daten (Name, E-Mail-Adresse, Nachricht) ausschließlich zur Bearbeitung deiner Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Anfrage) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).', 'If you contact us through the contact form, we process the information you provide (name, email address, message) solely to handle your inquiry. The legal basis is Art. 6(1)(b) GDPR (pre-contractual inquiry) or Art. 6(1)(f) GDPR (legitimate interest in responding to inquiries).', 10),
  ('privacy', 's5_heading', 'Section 5 — heading', 'text', '5. Kundenkonto und Anmeldung', '5. Customer accounts and login', 11),
  ('privacy', 's5_body', 'Section 5 — body', 'textarea', 'Wenn du ein Konto erstellst, speichern wir deine E-Mail-Adresse und die zugehörigen Bestelldaten, damit du deine Bestellhistorie einsehen kannst. Die Verwaltung von Konten und Anmeldedaten erfolgt über unseren Datenbank- und Authentifizierungs-Dienstleister Supabase. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).', 'If you create an account, we store your email address and associated order data so you can view your order history. Account and login management is handled by our database and authentication provider, Supabase. The legal basis is Art. 6(1)(b) GDPR (contract fulfillment).', 12),
  ('privacy', 's6_heading', 'Section 6 — heading', 'text', '6. Bestellung und Zahlungsabwicklung', '6. Orders and payment processing', 13),
  ('privacy', 's6_body', 'Section 6 — body', 'textarea', 'Zur Abwicklung deiner Bestellung erheben wir die notwendigen Daten — Name, Lieferadresse, E-Mail-Adresse, Telefonnummer. Die Zahlungsabwicklung erfolgt über unseren Zahlungsdienstleister Stripe. Deine Zahlungsdaten (z. B. Kartendaten) werden ausschließlich von Stripe verarbeitet und laufen nicht über unsere eigenen Server. Weitere Informationen findest du in der <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Stripe</a>. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).', 'To process your order, we collect the necessary information — name, shipping address, email address, phone number. Payment is processed by our payment provider, Stripe. Your payment details (e.g. card information) are handled exclusively by Stripe and never pass through our own servers. See Stripe''s privacy policy for further information. The legal basis is Art. 6(1)(b) GDPR (contract fulfillment).', 14),
  ('privacy', 's7_heading', 'Section 7 — heading', 'text', '7. Rechnungsstellung und Aufbewahrungspflichten', '7. Invoicing and retention obligations', 15),
  ('privacy', 's7_body', 'Section 7 — body', 'textarea', 'Für jede Bestellung erstellen wir eine Rechnung mit den gesetzlich vorgeschriebenen Angaben. Rechnungen unterliegen der gesetzlichen Aufbewahrungspflicht von 10 Jahren (§ 147 AO) und werden entsprechend so lange gespeichert, auch wenn ein Kundenkonto zwischenzeitlich gelöscht wird.', 'We issue an invoice with all legally required details for every order. Invoices are subject to a legal retention requirement of 10 years (§147 AO, German tax code) and are kept for that period accordingly, even if a customer account is deleted in the meantime.', 16),
  ('privacy', 's8_heading', 'Section 8 — heading', 'text', '8. E-Mail-Kommunikation', '8. Email communication', 17),
  ('privacy', 's8_body', 'Section 8 — body', 'textarea', 'Automatisierte E-Mails (z. B. Bestellbestätigungen) versenden wir über den E-Mail-Dienstleister Resend. Unser eigenes geschäftliches Postfach wird über Zoho Mail betrieben. Beide Anbieter verarbeiten die für den Versand notwendigen Daten (E-Mail-Adresse, Inhalt der Nachricht) in unserem Auftrag.', 'Automated emails (such as order confirmations) are sent via our email provider, Resend. Our own business inbox is operated through Zoho Mail. Both providers process the data necessary for delivery (email address, message content) on our behalf.', 18),
  ('privacy', 's9_heading', 'Section 9 — heading', 'text', '9. Webanalyse', '9. Web analytics', 19),
  ('privacy', 's9_body', 'Section 9 — body', 'textarea', 'Mit deiner Zustimmung nutzen wir Vercel Web Analytics zur anonymisierten Auswertung der Websitenutzung. Dieser Dienst setzt keine Cookies und erstellt keine personenbezogenen Nutzungsprofile. Die Verarbeitung erfolgt nur, wenn du der Kategorie „Statistik“ in unserem Cookie-Banner zugestimmt hast, und kann dort jederzeit widerrufen werden.', 'With your consent, we use Vercel Web Analytics to understand site usage in aggregate, anonymized form. This service does not set cookies and does not build personal usage profiles. It only runs if you''ve consented to the "Statistics" category in our cookie banner, which you can withdraw at any time.', 20),
  ('privacy', 's10_heading', 'Section 10 — heading', 'text', '10. Speicherdauer', '10. Retention period', 21),
  ('privacy', 's10_body', 'Section 10 — body', 'textarea', 'Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten dies vorschreiben (z. B. 10 Jahre für Rechnungen). Kontaktanfragen löschen wir, sobald sie abschließend bearbeitet sind und keine Aufbewahrungspflicht mehr besteht.', 'We keep personal data only as long as necessary for its purpose, or as required by law (e.g. 10 years for invoices). Contact inquiries are deleted once fully resolved and no retention obligation applies.', 22),
  ('privacy', 's11_heading', 'Section 11 — heading', 'text', '11. Deine Rechte', '11. Your rights', 23),
  ('privacy', 's11_body', 'Section 11 — body', 'textarea', 'Du hast jederzeit das Recht auf Auskunft über die zu deiner Person gespeicherten Daten, auf Berichtigung, Löschung oder Einschränkung der Verarbeitung, auf Datenübertragbarkeit sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen. Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn du der Ansicht bist, dass die Verarbeitung deiner Daten gegen die DSGVO verstößt.', 'You have the right at any time to request access to the data we hold about you, to correction, deletion, or restriction of processing, to data portability, and to withdraw any consent you''ve given. You also have the right to lodge a complaint with a data protection supervisory authority if you believe our processing of your data violates the GDPR.', 24),
  ('privacy', 's12_heading', 'Section 12 — heading', 'text', '12. Änderungen dieser Datenschutzerklärung', '12. Changes to this policy', 25),
  ('privacy', 's12_body', 'Section 12 — body', 'textarea', 'Wir passen diese Datenschutzerklärung an, sobald sich die rechtlichen Rahmenbedingungen oder unsere Datenverarbeitung ändern. Es gilt jeweils die aktuell auf dieser Seite veröffentlichte Fassung.', 'We update this privacy policy whenever our legal obligations or data processing practices change. The version currently published on this page is the one that applies.', 26),
  ('privacy', 's13_heading', 'Section 13 — heading', 'text', '13. Newsletter', '13. Newsletter', 28),
  ('privacy', 's13_body', 'Section 13 — body', 'textarea', 'Wenn du dich für unseren Newsletter anmeldest, speichern wir deine E-Mail-Adresse, deine Sprachauswahl und den Zeitpunkt der Anmeldung, um dir den Newsletter sowie deinen Willkommensrabatt zuzusenden. Der Versand erfolgt über unseren E-Mail-Dienstleister Resend. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst deine Einwilligung jederzeit über den Abmeldelink in jeder E-Mail widerrufen; deine Daten werden dann umgehend gelöscht.', 'If you sign up for our newsletter, we store your email address, language preference, and signup date in order to send you the newsletter and your welcome discount. Delivery is handled by our email provider, Resend. The legal basis is your consent (Art. 6(1)(a) GDPR). You can withdraw your consent at any time via the unsubscribe link in any email; your data will then be deleted promptly.', 28);
alter table site_content enable row level security;
create policy "Public can view site content" on site_content
  for select using (true);

-- Photos shown in the scrolling gallery near the bottom of the homepage
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

-- Customer reviews, verified by order number
create table reviews (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  rating integer,
  review_text text not null,
  image_url text,
  status text not null default 'pending', -- pending | approved | featured | rejected
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;
create policy "Public can view approved reviews" on reviews
  for select using (status in ('approved', 'featured'));

-- Admin-editable email templates (order confirmation, status updates,
-- abandoned cart). Not publicly readable — admin dashboard only.
create table email_templates (
  key text primary key,
  subject text not null,
  body text not null,
  updated_at timestamptz not null default now()
);
-- No public policies on purpose — internal templates, admin-only via the
-- service-role key, which bypasses RLS regardless.
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
),
(
  'newsletter_welcome',
  'Willkommen bei Artiza Studio',
  '<p>Danke für deine Anmeldung!</p>
<p>Nutze den Code <strong>{{code}}</strong> für 10&nbsp;% Rabatt auf deine erste Bestellung.</p>
<p style="font-size:12px;color:#888;margin-top:24px;">Du möchtest keine weiteren E-Mails erhalten? <a href="{{unsubscribe_url}}">Hier abmelden</a>.</p>'
);

-- Optional weight per product, used to calculate shipping automatically
alter table products add column weight_grams integer;

-- Weight-based shipping price tiers (Standard / Express)
create table shipping_rates (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('standard', 'express')),
  min_weight_g integer not null,
  max_weight_g integer,
  price_cents integer not null,
  sort_order integer not null default 0
);
alter table shipping_rates enable row level security;
insert into shipping_rates (method, min_weight_g, max_weight_g, price_cents, sort_order) values
  ('standard', 0, 500, 399, 1),
  ('standard', 501, 2000, 549, 2),
  ('standard', 2001, 5000, 799, 3),
  ('standard', 5001, null, 1099, 4),
  ('express', 0, 500, 799, 1),
  ('express', 501, 2000, 999, 2),
  ('express', 2001, 5000, 1299, 3),
  ('express', 5001, null, 1599, 4);

-- Free-Standard-shipping threshold (Express always stays paid)
create table shipping_settings (
  id integer primary key default 1,
  free_standard_threshold_cents integer,
  constraint single_row check (id = 1)
);
insert into shipping_settings (id, free_standard_threshold_cents) values (1, 5000);
alter table shipping_settings enable row level security;

-- Shipping cost actually charged, captured from Stripe at checkout
alter table orders add column shipping_cents integer;
-- Run this once in Supabase SQL Editor.

-- One sequential, gapless invoice number per invoice — legally required
-- under German law (§14 UStG), never reused even if an order is later
-- cancelled. Same pattern as generate_order_number().
create sequence invoice_number_seq;

create or replace function generate_invoice_number() returns text
language sql
as $$
  select 'RE-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0');
$$;

-- One row per invoice actually issued. The line-item detail already lives
-- on the orders table (unchanged after creation) — this just records that
-- an invoice was issued for a given order, its number, and where the PDF
-- lives in storage.
create sequence credit_note_number_seq;
create or replace function generate_credit_note_number() returns text
language sql
as $$
  select 'GS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('credit_note_number_seq')::text, 6, '0');
$$;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default generate_invoice_number(),
  order_number text not null,
  type text not null default 'invoice' check (type in ('invoice', 'credit_note')),
  related_invoice_number text,
  pdf_path text,
  created_at timestamptz not null default now()
);
create index invoices_order_number_idx on invoices (order_number);
alter table invoices enable row level security;
-- No public policies — invoices contain personal data, admin/service-role
-- access only (and the customer's own account API route, which checks
-- ownership itself before returning anything).

-- Your business's legal details, shown on every invoice. Starts empty —
-- fill these in via Admin -> Invoices before your first real sale.
create table invoice_settings (
  id integer primary key default 1,
  business_name text,
  address_line1 text,
  postal_code text,
  city text,
  country text default 'Deutschland',
  tax_number text, -- Steuernummer
  kleinunternehmer boolean not null default true,
  footer_note text,
  bank_iban text,
  bank_bic text,
  constraint single_row check (id = 1)
);
insert into invoice_settings (id) values (1);
alter table invoice_settings enable row level security;

-- The editable HTML/CSS template used to render every invoice PDF.
create table invoice_template (
  id integer primary key default 1,
  html text not null,
  constraint single_row check (id = 1)
);
alter table invoice_template enable row level security;

insert into invoice_template (id, html) values (1, '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #161412; font-size: 13px; padding: 48px; }
  h1 { font-size: 22px; margin: 0 0 4px 0; }
  .muted { color: #55524c; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .meta { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin: 24px 0; }
  th { text-align: left; border-bottom: 1px solid #161412; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 8px; border-bottom: 1px solid #d8d6cf; }
  .total-row td { border-bottom: none; border-top: 2px solid #161412; font-weight: bold; padding-top: 12px; }
  .footer { margin-top: 48px; font-size: 11px; color: #55524c; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>{{business_name}}</h1>
      <p class="muted">{{business_address}}</p>
    </div>
    <div class="meta">
      <p><strong>{{document_type}} {{invoice_number}}</strong></p>
      <p class="muted">Datum: {{invoice_date}}</p>
      <p class="muted">Bestellnr.: {{order_number}}</p>
      <p class="muted">{{related_invoice_line}}</p>
    </div>
  </div>

  <p><strong>Rechnungsempfänger</strong><br>
  {{customer_name}}<br>
  {{customer_address}}</p>

  <table>
    <thead>
      <tr><th>Artikel</th><th>Menge</th><th>Betrag</th></tr>
    </thead>
    <tbody>
      {{items_rows}}
      <tr><td>Versand</td><td></td><td>{{shipping_amount}}</td></tr>
      <tr class="total-row"><td>Gesamtbetrag</td><td></td><td>{{total_amount}}</td></tr>
    </tbody>
  </table>

  <p>{{kleinunternehmer_notice}}</p>

  <div class="footer">
    <p>{{business_name}} · {{business_address}} · Steuernummer: {{tax_number}}</p>
    <p>{{footer_note}}</p>
  </div>
</body>
</html>');

-- Private storage bucket for invoice PDFs (unlike the public "artwork"
-- bucket used for product photos — invoices contain personal data and
-- are only ever accessed via signed URLs or the service-role key).
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Newsletter subscribers
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'de',
  subscribed_at timestamptz not null default now()
);
alter table newsletter_subscribers enable row level security;

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('home', 'newsletterHeading', 'Newsletter section — heading', 'text',
    'Bleib auf dem Laufenden', 'Stay in the loop', 10),
  ('home', 'newsletterBody', 'Newsletter section — body', 'textarea',
    'Melde dich für unseren Newsletter an und erhalte 10 % Rabatt auf deine erste Bestellung.',
    'Sign up for our newsletter and get 10% off your first order.', 11),
  ('home', 'newsletterCode', 'Welcome discount code shown/emailed to new subscribers — must match a real code created in Admin -> Discounts', 'text',
    'WILLKOMMEN10', 'WILLKOMMEN10', 12);

-- Per-product custom text field at checkout (e.g. letter-mold names)
alter table products add column custom_text_enabled boolean not null default false;
alter table products add column custom_text_max_length integer default 30;
alter table products add column custom_text_label text;
alter table products add column custom_text_label_en text;

alter table orders add column custom_text text;

create table pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  cart_items jsonb not null,
  created_at timestamptz not null default now()
);
alter table pending_checkouts enable row level security;

-- Per-character pricing mode for personalized products
alter table products add column custom_text_pricing_mode text not null default 'fixed'
  check (custom_text_pricing_mode in ('fixed', 'per_character'));
alter table products add column custom_text_price_per_char_cents integer;
alter table products add column custom_text_min_length integer;

-- Widerrufsbelehrung (right of withdrawal) legal page
-- worth a lawyer's look before go-live, same as your other legal pages.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values

('widerruf', 'eyebrow', 'Small label above the title', 'text', 'Rechtliches', 'Legal', 1),
('widerruf', 'title', 'Page title', 'text', 'Widerrufsbelehrung', 'Right of Withdrawal', 2),

('widerruf', 's1_heading', 'Section 1 — heading', 'text', '1. Widerrufsrecht', '1. Right of withdrawal', 3),
('widerruf', 's1_body', 'Section 1 — body', 'textarea',
'Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.<br><br>Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von dir benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen hast bzw. hat.<br><br>Um dein Widerrufsrecht auszuüben, musst du uns (Artiza Studio, Inh. Nithi Prabhanand, Hinterbergstr. 17, 65207 Wiesbaden, E-Mail: info@artizastudio.de) mittels einer eindeutigen Erklärung (z.&nbsp;B. ein mit der Post versandter Brief oder eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.<br><br>Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.',
'You have the right to withdraw from this contract within fourteen days without giving any reason.<br><br>The withdrawal period is fourteen days from the day on which you, or a third party named by you who is not the carrier, took possession of the goods.<br><br>To exercise your right of withdrawal, you must inform us (Artiza Studio, owner Nithi Prabhanand, Hinterbergstr. 17, 65207 Wiesbaden, Germany, email: info@artizastudio.de) of your decision to withdraw from this contract by means of a clear statement (e.g. a letter sent by post or an email). You may use the model withdrawal form below, although this is not obligatory.<br><br>To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise of the right of withdrawal before the withdrawal period has expired.',
3),

('widerruf', 's2_heading', 'Section 2 — heading', 'text', '2. Folgen des Widerrufs', '2. Consequences of withdrawal', 4),
('widerruf', 's2_body', 'Section 2 — body', 'textarea',
'Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass du eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt hast), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.<br><br>Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis du den Nachweis erbracht hast, dass du die Waren zurückgesandt hast, je nachdem, welches der frühere Zeitpunkt ist.<br><br>Du hast die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem du uns über den Widerruf dieses Vertrags unterrichtest, an uns zurückzusenden. Die Frist ist gewahrt, wenn du die Waren vor Ablauf der Frist von vierzehn Tagen absendest.<br><br>Du trägst die unmittelbaren Kosten der Rücksendung der Waren.<br><br>Du musst für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.',
'If you withdraw from this contract, we will reimburse all payments received from you, including delivery costs (except for the supplementary costs arising if you chose a type of delivery other than the least expensive standard delivery offered by us), without undue delay and at the latest within fourteen days from the day on which we received notification of your withdrawal. We will use the same means of payment you used for the original transaction, unless expressly agreed otherwise; in no event will you be charged any fees for this reimbursement.<br><br>We may withhold reimbursement until we have received the goods back, or until you have supplied evidence of having sent back the goods, whichever is earlier.<br><br>You must return the goods without undue delay and in any event no later than fourteen days from the day on which you inform us of the withdrawal. The deadline is met if you send the goods before the period of fourteen days has expired.<br><br>You bear the direct cost of returning the goods.<br><br>You are only liable for any diminished value of the goods resulting from handling other than what is necessary to establish the nature, characteristics, and functioning of the goods.',
4),

('widerruf', 's3_heading', 'Section 3 — heading', 'text', '3. Ausschluss des Widerrufsrechts', '3. Exclusion of the right of withdrawal', 5),
('widerruf', 's3_body', 'Section 3 — body', 'textarea',
'Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch dich maßgeblich ist oder die eindeutig auf deine persönlichen Bedürfnisse zugeschnitten sind (§&nbsp;312g Abs.&nbsp;2 Nr.&nbsp;1 BGB).<br><br>Das betrifft insbesondere Produkte, die du mit einer individuellen Gravur, einem Namen oder einem persönlichen Text personalisiert hast — zum Beispiel unsere Buchstaben-Gussformen. Für diese Artikel besteht kein Widerrufsrecht, da sie eigens für dich angefertigt werden.<br><br>Alle anderen, nicht personalisierten Artikel kannst du im Rahmen des oben beschriebenen gesetzlichen Widerrufsrechts zurücksenden.',
'The right of withdrawal does not apply to contracts for the supply of goods that are not prefabricated and for the production of which an individual choice or decision by you is decisive, or that are clearly personalized to your specifications.<br><br>This applies in particular to products you have personalized with an individual engraving, name, or personal text — for example, our letter-mold products. There is no right of withdrawal for these items, since they are made specifically for you.<br><br>All other, non-personalized items can be returned under the statutory right of withdrawal described above.',
5),

('widerruf', 's4_heading', 'Section 4 — heading', 'text', '4. Muster-Widerrufsformular', '4. Model withdrawal form', 6),
('widerruf', 's4_body', 'Section 4 — body', 'textarea',
'(Wenn du den Vertrag widerrufen willst, fülle bitte dieses Formular aus und sende es zurück.)<br><br>An:<br>Artiza Studio, Inh. Nithi Prabhanand<br>Hinterbergstr. 17, 65207 Wiesbaden<br>E-Mail: info@artizastudio.de<br><br>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*):<br><br>_______________________________________________<br><br>Bestellt am (*)/erhalten am (*): _______________________<br><br>Name des/der Verbraucher(s):<br><br>_______________________________________________<br><br>Anschrift des/der Verbraucher(s):<br><br>_______________________________________________<br><br>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):<br><br>_______________________________________________<br><br>Datum: _______________________<br><br>(*) Unzutreffendes streichen.',
'(If you want to withdraw from the contract, please fill out this form and send it back.)<br><br>To:<br>Artiza Studio, owner Nithi Prabhanand<br>Hinterbergstr. 17, 65207 Wiesbaden, Germany<br>Email: info@artizastudio.de<br><br>I/we (*) hereby give notice that I/we (*) withdraw from my/our (*) contract of sale of the following goods (*)/for the provision of the following service (*):<br><br>_______________________________________________<br><br>Ordered on (*)/received on (*): _______________________<br><br>Name of consumer(s):<br><br>_______________________________________________<br><br>Address of consumer(s):<br><br>_______________________________________________<br><br>Signature of consumer(s) (only if this form is notified on paper):<br><br>_______________________________________________<br><br>Date: _______________________<br><br>(*) Delete as appropriate.',
6)

on conflict (page_key, field_key) do nothing;

-- Product variations: an optional dropdown of named options on a
-- product (e.g. "Mom + Dad", "Full Family of 5"), each with its own
-- price. Toggled per product in Admin -> Artwork.
alter table products add column variations_enabled boolean not null default false;

create table product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  label_en text,
  price_cents integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_variations_product_id_idx on product_variations (product_id);

alter table product_variations enable row level security;
create policy "Public can view product variations" on product_variations
  for select using (true);

alter table orders add column variation_label text;

-- "Build Your Own Box": admin-managed categories of priced articles the
-- customer assembles into a custom box on its own page.
create table custom_box_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table custom_box_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references custom_box_categories(id) on delete cascade,
  label text not null,
  label_en text,
  price_cents integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index custom_box_articles_category_id_idx on custom_box_articles (category_id);

alter table custom_box_categories enable row level security;
create policy "Public can view custom box categories" on custom_box_categories
  for select using (true);

alter table custom_box_articles enable row level security;
create policy "Public can view custom box articles" on custom_box_articles
  for select using (true);

alter table shipping_settings add column custom_box_shipping_cents integer not null default 500;
alter table shipping_settings add column custom_box_min_order_cents integer not null default 2000;

alter table orders add column order_type text not null default 'standard';
alter table orders add constraint orders_order_type_check
  check (order_type in ('standard', 'custom_box'));
alter table orders add column custom_box_items jsonb;
alter table orders add column custom_box_notes text;

-- Product safety notice (shown on every product page; see migration-product-safety.sql)
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('product_safety', 'heading', 'Heading of the safety box', 'text',
    'Sicherheitshinweise', 'Safety information', 1),
  ('product_safety', 'warning', 'Main warning (shown in bold) — small parts / under 3 years', 'textarea',
    'Achtung! Nicht für Kinder unter 36 Monaten geeignet. Erstickungsgefahr durch verschluckbare Kleinteile.',
    'Warning! Not suitable for children under 36 months. Choking hazard due to small parts.', 2),
  ('product_safety', 'age', 'Recommended age', 'text',
    'Empfohlen ab 4 Jahren.', 'Recommended for ages 4 and up.', 3),
  ('product_safety', 'supervision', 'Supervision note', 'text',
    'Nur unter Aufsicht von Erwachsenen verwenden.', 'Use only under adult supervision.', 4),
  ('product_safety', 'contents_label', 'Label in front of the kit contents (the contents text itself comes from each product''s "Size / kit contents" field; hidden if that is empty)', 'text',
    'Lieferumfang:', 'Kit contents:', 5),
  ('product_safety', 'material', 'Material note (check against your paint safety data sheet!)', 'textarea',
    'Farben auf Wasserbasis. Nicht zum Verzehr geeignet. Bei Haut- oder Augenkontakt mit Wasser spülen.',
    'Water-based paints. Not for consumption. In case of skin or eye contact, rinse with water.', 6),
  ('product_safety', 'dust', 'Gypsum dust note', 'text',
    'Gipsstaub nicht einatmen. Auf abwaschbarer Unterlage arbeiten.',
    'Do not inhale gypsum dust. Work on a washable surface.', 7),
  ('product_safety', 'ce', 'CE statement — leave EMPTY until your toy-safety conformity process (EN 71 testing, declaration of conformity) is complete', 'text',
    null, null, 8),
  ('product_safety', 'manufacturer', 'Manufacturer line (name, postal address, email — required by GPSR)', 'textarea',
    'Hersteller: Artiza Studio, Inh. Nithi Prabhanand, Hinterbergstr. 17, 65207 Wiesbaden, Deutschland, info@artizastudio.de',
    'Manufacturer: Artiza Studio, owner Nithi Prabhanand, Hinterbergstr. 17, 65207 Wiesbaden, Germany, info@artizastudio.de', 9)
on conflict (page_key, field_key) do nothing;

-- Supplies register and shipment traceability (see migration-supplies-traceability.sql)
create table supply_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'paint'
    check (kind in ('paint', 'casting_powder', 'other')),
  name text not null,              -- e.g. "Fingerfarbe Rot", "Gießpulver Ultraweiß"
  supplier text not null,
  batch_number text not null,      -- Chargennummer / LOT from the packaging
  purchased_at date not null,
  quantity text,                   -- free text, e.g. "6 x 250 ml" or "5 kg"
  best_before date,                -- MHD
  invoice_number text,             -- supplier's invoice no., to find the paper receipt
  notes text,
  created_at timestamptz not null default now()
);
create index supply_items_kind_idx on supply_items (kind, purchased_at desc);
alter table supply_items enable row level security;

create table shipment_records (
  id uuid primary key default gen_random_uuid(),
  shipped_at date not null default current_date,
  order_number text not null,      -- shop order number, e.g. AS-2610-000012
  kit_batch_number text not null,  -- your own batch / production number for the package
  notes text,
  created_at timestamptz not null default now()
);
create index shipment_records_order_idx on shipment_records (order_number);
alter table shipment_records enable row level security;

-- Which supply batches went into which package. A supply item that is linked
-- to a shipment cannot be deleted (on delete restrict) so trace records never
-- end up pointing at nothing; deleting a shipment removes its links.
create table shipment_supplies (
  shipment_id uuid not null references shipment_records(id) on delete cascade,
  supply_id uuid not null references supply_items(id) on delete restrict,
  primary key (shipment_id, supply_id)
);
create index shipment_supplies_supply_idx on shipment_supplies (supply_id);
alter table shipment_supplies enable row level security;

-- Withdrawal button / Widerrufsbutton (see migration-withdrawal-button.sql)
create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),   -- time of receipt
  name text not null,
  email text not null,
  order_number text not null,
  order_matched boolean not null default false,    -- order number + email matched an order
  items_note text,                                  -- empty = whole order
  status text not null default 'received'
    check (status in ('received', 'processed')),
  processed_at timestamptz
);
create index withdrawal_requests_created_idx on withdrawal_requests (created_at desc);
create index withdrawal_requests_email_idx on withdrawal_requests (email, created_at desc);
alter table withdrawal_requests enable row level security;

insert into email_templates (key, subject, body) values
(
  'withdrawal_confirmation',
  'Eingangsbestätigung deines Widerrufs – Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>wir bestätigen den Eingang deiner Widerrufserklärung zur Bestellung <strong>{{order_number}}</strong> am <strong>{{received_at}}</strong>.</p>
<p>Betroffene Artikel: {{items}}</p>
<p>Wir prüfen deine Angaben und melden uns in Kürze mit den nächsten Schritten zu Rücksendung und Erstattung.</p>
<p style="font-size:12px;color:#888;margin-top:24px;">Dies ist eine automatische Eingangsbestätigung. Bei Rückfragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;

-- Legal updates for the withdrawal button (see migration-legal-withdrawal-updates.sql)
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

-- Optional withdrawal reason (see migration-withdrawal-reason.sql)
alter table withdrawal_requests
  add column if not exists reason_code text,
  add column if not exists reason_note text;

-- Order history (see migration-order-history.sql)
create table order_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_number text not null,
  event_type text not null,
  from_status text,
  to_status text,
  source text not null default 'admin',
  note text
);
create index order_events_order_idx on order_events (order_number, created_at);
alter table order_events enable row level security;

-- Refund confirmation email (see migration-refund-email.sql)
alter table withdrawal_requests add column if not exists refund_email_sent_at timestamptz;
insert into email_templates (key, subject, body) values
(
  'refund_confirmation',
  'Deine Erstattung zur Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>wir haben deine Erstattung zur Bestellung <strong>{{order_number}}</strong> veranlasst.</p>
<p>Erstattungsbetrag: <strong>{{amount}}</strong></p>
<p>Das Geld geht auf demselben Zahlungsweg zurück, den du bei der Bestellung genutzt hast. Bis die Gutschrift auf deinem Konto erscheint, kann es je nach Bank etwa 5–10 Werktage dauern.</p>
<p>Bei Fragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;

-- Return instructions email (see migration-return-email.sql)
alter table withdrawal_requests add column if not exists return_email_sent_at timestamptz;
insert into email_templates (key, subject, body) values
(
  'return_instructions',
  'Rücksendung zu deinem Widerruf – Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>vielen Dank, wir haben deinen Widerruf zur Bestellung <strong>{{order_number}}</strong> erhalten.</p>
<p>Bitte sende die Ware an:</p>
<p>Artiza Studio<br>Hinterbergstr. 17<br>65207 Wiesbaden<br>Deutschland</p>
<p>Bitte sende die Ware spätestens innerhalb von 14 Tagen zurück. Die Kosten der Rücksendung trägst du.</p>
<p>Sobald das Paket bei uns eingetroffen ist (oder du uns einen Versandnachweis schickst), erstatten wir dir den Betrag auf demselben Zahlungsweg, den du bei der Bestellung genutzt hast.</p>
<p>Bei Fragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;

-- Promotion ribbon (see migration-promo-ribbon.sql)
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('promo', 'badge', 'Big text on the ribbon, e.g. -15 %  (leave empty together with the short text to hide the ribbon)', 'text', '', '', 1),
  ('promo', 'text', 'Short text next to it, e.g. auf alle Bausätze', 'text', '', '', 2),
  ('promo', 'code', 'Discount code shown on the ribbon (optional; customers tap it to copy)', 'text', '', '', 3),
  ('promo', 'link', 'Page the short text links to (optional), e.g. /shop', 'text', '', '', 4)
on conflict do nothing;

-- Shipping time note + Widerrufsbelehrung in the order email (see migration-order-legal-and-shipping-note.sql)
insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('shipping_note', 'text', 'Shipping time note (leave empty to hide)', 'textarea',
    'Handgemacht mit Liebe: Dein Set wird innerhalb von 2 Werktagen versendet. Gute Dinge brauchen eben ein bisschen Zeit!',
    'Handmade with love: your kit ships within 2 working days. Good things take a little time!', 1)
on conflict (page_key, field_key) do nothing;
update email_templates
set body = body || '
<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 16px;">
<p><strong>Widerrufsbelehrung</strong></p>
{{widerrufsbelehrung}}'
where key = 'order_confirmation' and body not like '%{{widerrufsbelehrung}}%';

-- AGB in the order confirmation email (see migration-agb-in-order-email.sql)
update email_templates
set body = body || '
<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 16px;">
<p><strong>Allgemeine Geschäftsbedingungen (AGB)</strong></p>
{{agb}}'
where key = 'order_confirmation' and body not like '%{{agb}}%';
-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Product page upgrade:
--  * Each variation (option) can now carry "What's in the box" text, a "Colors included"
--    text (German + English), a photo to show when selected, and a "preselected" flag.
--  * A standard "Materials used" text shown on every product page, edited in
--    Admin -> Content -> "Materials used (all product pages)". Clear it to hide the section.
-- Needs migration-page-content.sql (site_content) and the product variations table first.

alter table product_variations
  add column if not exists box_contents text,
  add column if not exists box_contents_en text,
  add column if not exists colors_included text,
  add column if not exists colors_included_en text,
  add column if not exists image_index integer,
  add column if not exists is_default boolean not null default false;

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('product_materials', 'text', 'Materials used (shown on every product page; leave empty to hide)', 'textarea',
    'Die Figuren werden aus Gips gegossen und von Hand gefertigt. Bitte ergänze hier die weiteren Materialien (Farben, Pinsel, Verpackung).',
    'The figures are cast from plaster and made by hand. Please add the other materials here (paints, brushes, packaging).', 1)
on conflict (page_key, field_key) do nothing;
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

-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Kleinunternehmer fix: the Terms (AGB) section 2 said prices "include the applicable VAT".
-- As a small business under § 19 UStG you do not charge VAT, so that sentence is replaced.
-- Only touches the first sentence, and only if it still has the original wording; if you
-- edited the text yourself, change it by hand in Admin -> Content -> Terms & Conditions.
-- Needs migration-impressum-and-editable-terms.sql first.

update site_content
set value_de = replace(value_de, 'Alle Preise werden in Euro (EUR) angezeigt und enthalten die geltende Mehrwertsteuer, sofern nicht anders angegeben.', 'Alle Preise werden in Euro (EUR) angezeigt. Als Kleinunternehmer im Sinne von § 19 UStG erheben wir keine Umsatzsteuer und weisen sie daher nicht aus. Hinzu kommen gegebenenfalls Versandkosten, die vor Abschluss der Bestellung angezeigt werden.')
where page_key = 'terms' and field_key = 's2_body' and value_de like '%enthalten die geltende Mehrwertsteuer%';

update site_content
set value_en = replace(value_en, 'All prices are shown in Euros (EUR) and include applicable taxes unless stated otherwise.', 'All prices are shown in Euros (EUR). As a small business under § 19 UStG (German VAT Act), we do not charge VAT and therefore do not show it. Shipping costs may be added and are shown before you complete your order.')
where page_key = 'terms' and field_key = 's2_body' and value_en like '%include applicable taxes%';

-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Fills in the standard "Materials used" text shown in the accordion on every product page.
-- Only replaces the original placeholder text; if you already edited it in
-- Admin -> Content -> "Materials used (all product pages)", your version is kept.
-- Needs migration-product-details-accordions.sql first.

update site_content
set value_de = 'Unsere Figuren werden in Deutschland aus hochwertigem Gießpulver auf Gipsbasis von Hand gegossen. Die Farben sind wasserbasiert, kinderfreundlich und für Spielzeug nach EN 71 geeignet. Ein Pinsel liegt jedem Set bei.'
where page_key = 'product_materials' and field_key = 'text' and value_de = 'Die Figuren werden aus Gips gegossen und von Hand gefertigt. Bitte ergänze hier die weiteren Materialien (Farben, Pinsel, Verpackung).';

update site_content
set value_en = 'Our figures are hand-cast in Germany from high-quality gypsum-based casting powder. The paints are water-based, kid-friendly and suitable for toys under EN 71. A paintbrush is included in every set.'
where page_key = 'product_materials' and field_key = 'text' and value_en = 'The figures are cast from plaster and made by hand. Please add the other materials here (paints, brushes, packaging).';

-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Special add-on colors (e.g. glitter colors). You add them in Admin -> Special colors
-- (name in German and English, a swatch color, a price per color - 0,50 EUR by default,
-- and an on/off switch). Every product page then asks the customer whether they want
-- any of them; each chosen color is added to the price per set. Nothing shows on the
-- product pages until you add at least one active color.

create table if not exists special_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  hex text,
  price_cents integer not null default 50,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table special_colors enable row level security;
drop policy if exists "Public can view active special colors" on special_colors;
create policy "Public can view active special colors" on special_colors
  for select using (active = true);
