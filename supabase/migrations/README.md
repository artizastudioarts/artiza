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
20. `migration-privacy-policy.sql` — adds the Privacy Policy page's content (needs #9 first)
21. `migration-newsletter.sql` — newsletter subscribers table and the homepage signup section content (needs #9 first)
22. `migration-newsletter-legal-updates.sql` — adds a Newsletter section to the Privacy Policy and corrects the outdated Terms section about promotional emails (needs #20 and #18 first)
23. `migration-custom-text.sql` — per-product custom text field at checkout (e.g. letter-mold names), plus the checkout staging table this depends on
24. `migration-per-character-pricing.sql` — per-character pricing mode for personalized products (needs #23 first)
25. `migration-newsletter-email-template.sql` — moves the newsletter welcome email into the admin-editable template system (needs #13 first, the email_templates table)
26. `migration-widerrufsbelehrung.sql` — the EU right-of-withdrawal legal page (needs #9 first)
27. `migration-product-variations.sql` — optional priced dropdown options per product (e.g. "Mom + Dad" vs "Full Family of 5")
28. `migration-custom-box.sql` — "Build Your Own Box": admin-managed categories/articles, flat box shipping, minimum order value, and the order fields to record what was built
29. `migration-product-safety.sql` — admin-editable "Sicherheitshinweise" (age 4+, small-parts warning, supervision, manufacturer address) shown on every product page (needs #9 first)
30. `migration-supplies-traceability.sql` — admin-only Supplies register (paint / casting powder purchases with batch numbers) and Shipments log (order number, kit batch, which supply batches were used), both with CSV export
31. `migration-withdrawal-button.sql` — the electronic withdrawal function ("Vertrag widerrufen": requests table plus the customer confirmation email template) (needs #13 first, the email_templates table)
32. `migration-legal-withdrawal-updates.sql` — Privacy Policy section 14, a withdrawal-form line in the Widerrufsbelehrung, and a withdrawal link in the order confirmation email (needs #31, #20, #26 and #13 first)
33. `migration-withdrawal-reason.sql` — optional, voluntary reason on the withdrawal form, plus a sentence in Privacy Policy section 14 (needs #31 and #32 first)

34. `migration-order-history.sql` — order history log (status changes, withdrawals) shown per order in the admin Orders tab

35. `migration-refund-email.sql` — editable refund confirmation email and a "Send refund email" button in the Withdrawals tab (needs #31 and #34 first)

36. `migration-return-email.sql` — editable return-instructions email and a "Send return instructions" button in the Withdrawals tab (needs #31 and #34 first)

37. `migration-promo-ribbon.sql` — floating promotion ribbon in the bottom corner, edited in Admin → Content → "Promotion ribbon" (needs #9 first)

38. `migration-order-legal-and-shipping-note.sql` — editable "ships within 2 working days" note on product pages and in the cart, and the full Widerrufsbelehrung inside the order confirmation email (needs #9, #26 and #13 first)

39. `migration-agb-in-order-email.sql` — the full AGB text inside the order confirmation email, after the Widerrufsbelehrung (needs #38 first)

40. `migration-product-details-accordions.sql` — option buttons with per-option "What's in the box", colors, photo and preselected flag, plus a standard "Materials used" text (needs #9 and the variations migration first)

41. `migration-newsletter-double-optin.sql` — newsletter double opt-in: confirmation email + confirm page, consent proof (confirmed_at), welcome code only after confirming (needs the newsletter migrations first)

42. `migration-terms-kleinunternehmer.sql` — AGB section 2: replaces "prices include VAT" with the § 19 UStG small-business wording (needs the editable-terms migration first)
43. `migration-product-materials-text.sql` — fills in the standard "Materials used" text (gypsum casting powder, water-based kid-friendly paints, brush included); keeps your text if you already edited it
44. `migration-special-colors.sql` — special add-on colors (glitter etc.): a table you manage in Admin -> Special colors; every product page offers them at a price per color

## Going forward

Any new database change I build for you will be added here as a new,
clearly-named file, and I'll add it to the end of this list with a short
description — same pattern as above.
