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
