-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- 1. Shipping-time note ("handmade, ships within 2 working days") shown on every
--    product page under the add-to-cart button and in the cart above the checkout
--    button. Edit it in Admin -> Content -> "Shipping time note". Clear it to hide it.
-- 2. The full Widerrufsbelehrung text (with the model withdrawal form) is added to the
--    order confirmation email, so the customer gets it in durable form. It is taken from
--    the Widerrufsbelehrung page text (Admin -> Content), so edits there reach the email too.
-- Needs migration-page-content.sql, migration-widerrufsbelehrung.sql and
-- migration-email-templates.sql first.
-- Keep the shipping promise realistic: it is a binding statement about delivery time,
-- and it should match what your AGB say.

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
