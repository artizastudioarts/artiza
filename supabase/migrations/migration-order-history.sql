-- Order history: every status change and withdrawal step is logged (v72).
-- Admin-only table (RLS on, no policies) — read/written with the service role only.
create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  order_number text not null,
  event_type text not null,        -- status_change | withdrawal_received | withdrawal_processed
  from_status text,
  to_status text,
  source text not null default 'admin',  -- admin | withdrawal
  note text
);
create index if not exists order_events_order_idx on order_events (order_number, created_at);
alter table order_events enable row level security;
