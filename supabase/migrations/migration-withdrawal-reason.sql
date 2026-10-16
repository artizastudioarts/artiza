-- Optional, voluntary reason for a withdrawal (v71).
-- Needs migration-withdrawal-button.sql first.
alter table withdrawal_requests
  add column if not exists reason_code text,
  add column if not exists reason_note text;

-- Privacy Policy section 14: mention the optional reason (appended once).
update site_content
set value_de = value_de || ' Optional kannst du außerdem einen Grund für den Widerruf angeben; die Angabe ist freiwillig und hat keinen Einfluss auf dein Widerrufsrecht.',
    value_en = value_en || ' You may also give a reason for the withdrawal; this is voluntary and has no effect on your right of withdrawal.'
where page_key = 'privacy' and field_key = 's14_body'
  and value_de not like '%Grund für den Widerruf%';
