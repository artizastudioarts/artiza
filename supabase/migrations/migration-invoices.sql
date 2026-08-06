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
create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default generate_invoice_number(),
  order_number text not null,
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
      <p><strong>Rechnung {{invoice_number}}</strong></p>
      <p class="muted">Datum: {{invoice_date}}</p>
      <p class="muted">Bestellnr.: {{order_number}}</p>
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
