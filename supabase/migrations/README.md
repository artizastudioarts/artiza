# Database migrations

This folder holds every SQL script that's changed your Supabase database
over the life of this project, one file per feature. Each one has already
been run once, in Supabase's SQL Editor, in the order below.

**You don't need to re-run any of these on your existing database** —
they're a historical record. This list is here so that if you (or I)
ever need to set up a **second** Supabase project — for a staging
environment, for example — you'd run these in this exact order to bring
a fresh database up to the same state as your live one.

For a **brand-new** project, it's faster to just run `../schema.sql`
instead, which already contains the end result of all of these combined
— you don't need to replay the migrations one by one.

## Run order

1. `migration-stock.sql` — original stock-quantity tracking (later removed from the app in `migration-product-badges.sql`'s companion code change; column stays in the database, just unused)
2. `migration-accounts.sql` — customer accounts and login
3. `migration-order-numbers.sql` — the `AS-2607-000001` style order numbers
4. `migration-phone.sql` — phone number collection at checkout
5. `migration-homepage.sql` — original homepage text fields (superseded by #9 below; harmless to have both applied)
6. `migration-consent-rollback.sql` — only relevant if you'd applied a since-removed "marketing consent checkbox" migration; safe to skip on a fresh setup
7. `migration-gallery.sql` — multiple photos per product
8. `migration-product-translations.sql` — English translations for product text
9. `migration-page-content.sql` — the admin Content tab's editable page text
10. `migration-home-carousel.sql` — homepage photo carousel (needs #9 first)
11. `migration-reviews.sql` — customer reviews (needs #9 first)
12. `migration-product-badges.sql` — Best Seller / Trending / etc. ribbons
13. `migration-email-templates.sql` — the admin Emails tab
14. `migration-shared-order-number.sql` — one order number per checkout instead of one per product (needs #3 first)
15. `migration-shipping.sql` — weight-based shipping rates and free-shipping threshold
16. `migration-invoices.sql` — sequential invoice numbers, business/tax settings, editable PDF template, and private storage for invoice PDFs
17. `migration-credit-notes.sql` — Rechnungskorrektur (credit note) support for cancelled orders that already had an invoice issued (needs #16 first)
18. `migration-impressum-and-editable-terms.sql` — adds the Impressum page's content, and moves Terms & Conditions text into the same admin-editable Content system as your homepage (needs #9 first)
19. `migration-faq-contact.sql` — adds the FAQ and Contact pages' content (needs #9 first)

## Going forward

Any new database change I build for you will be added here as a new,
clearly-named file, and I'll add it to the end of this list with a short
description — same pattern as above.
