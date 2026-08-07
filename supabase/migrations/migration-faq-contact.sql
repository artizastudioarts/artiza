-- Run this once in Supabase SQL Editor.
--
-- Adds two new admin-editable pages (via Admin -> Content, same system as
-- your Home page and Terms & Conditions): FAQ and Contact.

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
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
  ('faq', 'q6_answer', 'Answer 6', 'textarea', 'Aktuell versenden wir nur innerhalb Deutschlands. Schreib uns gerne, falls du Fragen zu einer Lieferung ins Ausland hast.', 'Right now we only ship within Germany. Feel free to reach out if you have questions about shipping abroad.', 14)
on conflict (page_key, field_key) do nothing;

insert into site_content (page_key, field_key, label, field_type, value_de, value_en, sort_order) values
  ('contact', 'eyebrow', 'Small label above the title', 'text', 'Kontakt', 'Contact', 1),
  ('contact', 'title', 'Page title', 'text', 'Kontaktiere uns', 'Get in Touch', 2),
  ('contact', 'intro', 'Intro paragraph', 'textarea', 'Fragen zu einer Bestellung oder einem Produkt? Schreib uns eine Nachricht — wir melden uns so schnell wie möglich zurück.', 'Questions about an order or a product? Send us a message — we''ll get back to you as soon as we can.', 3)
on conflict (page_key, field_key) do nothing;
