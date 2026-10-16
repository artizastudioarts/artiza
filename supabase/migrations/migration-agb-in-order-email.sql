-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Adds the full AGB (terms and conditions) text to the order confirmation email, after the
-- Widerrufsbelehrung, so the customer receives both in durable form. The text is taken from
-- the Terms page (Admin -> Content -> Terms), so edits there reach the email too.
-- Needs migration-order-legal-and-shipping-note.sql first.

update email_templates
set body = body || '
<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 16px;">
<p><strong>Allgemeine Geschäftsbedingungen (AGB)</strong></p>
{{agb}}'
where key = 'order_confirmation' and body not like '%{{agb}}%';
