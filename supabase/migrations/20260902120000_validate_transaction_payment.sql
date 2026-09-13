alter table public.transactions
  add constraint transactions_payment_not_blank
  check (btrim(payment) <> '');
