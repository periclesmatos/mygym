-- Quando o treino foi registrado: retroativo só pontua até 7 dias depois.
-- Nulo conta como finished_at, para uma imagem anterior continuar funcionando num rollback.
ALTER TABLE workout_session ADD COLUMN recorded_at timestamp(6) with time zone;
UPDATE workout_session SET recorded_at = finished_at WHERE finished_at IS NOT NULL;
CREATE INDEX idx_workout_session_user_finished ON workout_session (user_id, finished_at);
