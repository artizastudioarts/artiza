-- Run this once in Supabase SQL Editor.
--
-- Adds support for credit notes (Rechnungskorrektur) — the correct way to
-- handle a cancelled order that already had an invoice issued. The
-- original invoice is never edited or deleted (required by GoBD); instead
-- a second document is issued that references and reverses it.

-- A separate numbering series (GS- instead of RE-) so credit notes never
-- interleave with your regular invoice numbers.
create sequence credit_note_number_seq;

create or replace function generate_credit_note_number() returns text
language sql
as $$
  select 'GS-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('credit_note_number_seq')::text, 6, '0');
$$;

alter table invoices add column type text not null default 'invoice'
  check (type in ('invoice', 'credit_note'));
alter table invoices add column related_invoice_number text;

-- Updates your invoice template to support the new {{document_type}} and
-- {{related_invoice_line}} placeholders needed to render both document
-- types correctly.
--
-- ⚠️ If you've already customized your invoice template in Admin ->
-- Invoices, copy your current version somewhere safe before running this
-- — it will be overwritten with a version that includes the same content
-- plus the two new placeholders.
update invoice_template set html = '<!DOCTYPE html>
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
</html>' where id = 1;
