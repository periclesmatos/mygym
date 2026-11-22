-- Treino registrado depois de feito: sem cronômetro nem descanso, e o fim é informado ao salvar.
ALTER TABLE workout_session ADD COLUMN backdated boolean NOT NULL DEFAULT false;
