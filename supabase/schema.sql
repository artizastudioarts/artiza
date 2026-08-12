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
    'WILLKOMMEN10', 'WILLKOMMEN10', 12),
  ('home', 'newsletterBarText', 'Newsletter announcement bar — short message', 'text',
    '10 % Rabatt auf deine erste Bestellung — jetzt für den Newsletter anmelden',
    '10% off your first order — sign up for our newsletter',
    13);

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
