-- Run this once in Supabase SQL Editor to add the marketing homepage content.

create table home_content (
  id integer primary key default 1,
  headline text not null default 'Handmade with care, painted by you',
  subheadline text not null default 'PAINT-YOUR-OWN FIGURE KITS',
  body text not null default 'We design and hand-finish every figure model before it ships to your door as a paint-it-yourself kit. Watch how each piece comes together, then browse the shop to pick your next project.',
  video_url text,
  constraint single_row check (id = 1)
);

insert into home_content (id) values (1);

alter table home_content enable row level security;
create policy "Public can view home content" on home_content
  for select using (true);
-- writes only via the service role key (used in /admin), same pattern as products
