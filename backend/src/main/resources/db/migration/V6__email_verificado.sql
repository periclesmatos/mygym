-- Quando a pessoa provou ser dona do e-mail. Nulo = não verificado.
-- Sem backfill, nem para quem já tem Google ou Apple: o e-mail podia ser trocado depois de vincular.
-- Essas contas são marcadas no próximo login social em que o e-mail do provedor for o mesmo da conta.
ALTER TABLE app_user ADD COLUMN email_verified_at timestamp(6) with time zone;
