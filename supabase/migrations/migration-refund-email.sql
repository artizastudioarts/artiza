-- Refund confirmation email, sent from the Withdrawals tab (v74).
-- Needs migration-withdrawal-button.sql and migration-order-history.sql first.
alter table withdrawal_requests
  add column if not exists refund_email_sent_at timestamptz;

insert into email_templates (key, subject, body) values
(
  'refund_confirmation',
  'Deine Erstattung zur Bestellung {{order_number}}',
  '<p>Hallo {{name}},</p>
<p>wir haben deine Erstattung zur Bestellung <strong>{{order_number}}</strong> veranlasst.</p>
<p>Erstattungsbetrag: <strong>{{amount}}</strong></p>
<p>Das Geld geht auf demselben Zahlungsweg zurück, den du bei der Bestellung genutzt hast. Bis die Gutschrift auf deinem Konto erscheint, kann es je nach Bank etwa 5–10 Werktage dauern.</p>
<p>Bei Fragen antworte einfach auf diese E-Mail.</p>'
)
on conflict (key) do nothing;
