-- Return instructions email, sent from the Withdrawals tab (v75).
-- Needs migration-withdrawal-button.sql and migration-order-history.sql first.
alter table withdrawal_requests
  add column if not exists return_email_sent_at timestamptz;

insert into email_templates (key, subject, body) values
(
  'return_instructions',
  'Rücksendung zu deinem Widerruf – Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>vielen Dank, wir haben deinen Widerruf zur Bestellung <strong>{{order_number}}</strong> erhalten.</p>
<p>Bitte sende die Ware an:</p>
<p>Artiza Studio<br>Hinterbergstr. 17<br>65207 Wiesbaden<br>Deutschland</p>
<p>Bitte sende die Ware spätestens innerhalb von 14 Tagen zurück. Die Kosten der Rücksendung trägst du.</p>
<p>Sobald das Paket bei uns eingetroffen ist (oder du uns einen Versandnachweis schickst), erstatten wir dir den Betrag auf demselben Zahlungsweg, den du bei der Bestellung genutzt hast.</p>
<p>Bei Fragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;
