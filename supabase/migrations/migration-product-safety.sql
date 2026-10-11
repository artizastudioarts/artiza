-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Adds an admin-editable "Sicherheitshinweise" (safety notice) block that is
-- shown on EVERY product page, between the add-to-cart button and the
-- Made-in-Germany badge. Edit it in Admin -> Content -> "Product safety notice".
-- Needs migration-page-content.sql (the site_content table) first.
--
-- A field left empty in the admin is simply not shown, so you can remove a
-- line (e.g. the CE line) by clearing it. Texts are plain text, no HTML.
-- Have IHK / a lawyer confirm the wording before launch.

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
