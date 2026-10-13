-- Run this once in Supabase SQL Editor (staging first, then production).
--
-- Adds two admin-only registers for product traceability:
--   1. supply_items     — every paint / casting powder (or other material)
--                         you buy, with supplier and batch number
--   2. shipment_records — every package you ship: order number, your own kit
--                         batch number, and which supply batches went into it
--                         (linked through shipment_supplies)
-- Both tabs (Admin -> Supplies, Admin -> Shipments) can export CSV.
--
-- No stock counting and no uploaded receipts: this is purely a record for
-- tracing a package back to its materials (and the reverse: which packages
-- used a given batch, e.g. if a supplier recalls it).
--
-- Row Level Security is on with no policies, so only the admin API (service
-- role) can read or write these tables — the public site cannot.

create table supply_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'paint'
    check (kind in ('paint', 'casting_powder', 'other')),
  name text not null,              -- e.g. "Fingerfarbe Rot", "Gießpulver Ultraweiß"
  supplier text not null,
  batch_number text not null,      -- Chargennummer / LOT from the packaging
  purchased_at date not null,
  quantity text,                   -- free text, e.g. "6 x 250 ml" or "5 kg"
  best_before date,                -- MHD
  invoice_number text,             -- supplier's invoice no., to find the paper receipt
  notes text,
  created_at timestamptz not null default now()
);
create index supply_items_kind_idx on supply_items (kind, purchased_at desc);
alter table supply_items enable row level security;

create table shipment_records (
  id uuid primary key default gen_random_uuid(),
  shipped_at date not null default current_date,
  order_number text not null,      -- shop order number, e.g. AS-2610-000012
  kit_batch_number text not null,  -- your own batch / production number for the package
  notes text,
  created_at timestamptz not null default now()
);
create index shipment_records_order_idx on shipment_records (order_number);
alter table shipment_records enable row level security;

-- Which supply batches went into which package. A supply item that is linked
-- to a shipment cannot be deleted (on delete restrict) so trace records never
-- end up pointing at nothing; deleting a shipment removes its links.
create table shipment_supplies (
  shipment_id uuid not null references shipment_records(id) on delete cascade,
  supply_id uuid not null references supply_items(id) on delete restrict,
  primary key (shipment_id, supply_id)
);
create index shipment_supplies_supply_idx on shipment_supplies (supply_id);
alter table shipment_supplies enable row level security;
