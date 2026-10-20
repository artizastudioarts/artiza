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
