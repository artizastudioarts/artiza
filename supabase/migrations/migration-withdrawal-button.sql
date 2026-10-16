-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Adds the electronic withdrawal function ("Widerrufsbutton", required for
-- B2C online shops since 19 June 2026, EU Directive 2023/2673):
--   * withdrawal_requests — every withdrawal declared on /vertrag-widerrufen
--     (time of receipt, name, email, order number, whether it matched an order)
--   * an editable German email template "withdrawal_confirmation" — the
--     acknowledgment of receipt sent to the customer (Admin -> Emails)
-- Requests show up in Admin -> Withdrawals, and you also get an email.
-- Needs migration-email-templates.sql first (the email_templates table).
--
-- The table has no public policy: only the admin API (service role) can read
-- or write it. Have a lawyer / IHK confirm the wording before launch.

create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),   -- time of receipt
  name text not null,
  email text not null,
  order_number text not null,
  order_matched boolean not null default false,    -- order number + email matched an order
  items_note text,                                  -- empty = whole order
  status text not null default 'received'
    check (status in ('received', 'processed')),
  processed_at timestamptz
);
create index withdrawal_requests_created_idx on withdrawal_requests (created_at desc);
create index withdrawal_requests_email_idx on withdrawal_requests (email, created_at desc);
alter table withdrawal_requests enable row level security;

insert into email_templates (key, subject, body) values
(
  'withdrawal_confirmation',
  'Eingangsbestätigung deines Widerrufs – Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>wir bestätigen den Eingang deiner Widerrufserklärung zur Bestellung <strong>{{order_number}}</strong> am <strong>{{received_at}}</strong>.</p>
<p>Betroffene Artikel: {{items}}</p>
<p>Wir prüfen deine Angaben und melden uns in Kürze mit den nächsten Schritten zu Rücksendung und Erstattung.</p>
<p style="font-size:12px;color:#888;margin-top:24px;">Dies ist eine automatische Eingangsbestätigung. Bei Rückfragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;
