-- Ajustes da V7 e da V6, que já rodaram em bancos de desenvolvimento e por isso não são editadas.

-- 1. A V7 tomou por minutos qualquer reps até 300: 200 pulos de corda com meta "20 min" viraram 200 min.
--    Só é minuto o que cabe em até 3x a meta. O que veio da conversão se reconhece por
--    duração = reps x 60 e intensidade nula; o cardio novo não grava reps.
CREATE TEMP TABLE cardio_implausivel AS
SELECT e.id
FROM session_exercise e
CROSS JOIN LATERAL regexp_match(e.target_reps, '^\s*([0-9]+)(?:\s*-\s*([0-9]+))?\s*min') AS meta
WHERE e.kind = 'cardio'
  AND EXISTS (SELECT 1 FROM workout_set w
              WHERE w.exercise_id = e.id
                AND w.completed_at IS NOT NULL
                AND w.intensity IS NULL
                AND w.duration_seconds = w.reps * 60
                AND w.reps > 3 * coalesce(meta[2], meta[1])::numeric);

UPDATE workout_set SET duration_seconds = NULL
WHERE exercise_id IN (SELECT id FROM cardio_implausivel)
  AND intensity IS NULL
  AND duration_seconds = reps * 60;
UPDATE session_exercise SET kind = 'strength' WHERE id IN (SELECT id FROM cardio_implausivel);

-- 2. A V7 converteu antes de inserir Corrida, Caminhada e as outras atividades novas.
CREATE TEMP TABLE cardio_esquecido AS
SELECT e.id, 3 * coalesce(meta[2], meta[1])::numeric AS teto
FROM session_exercise e
JOIN workout_session s ON s.id = e.session_id
CROSS JOIN LATERAL regexp_match(e.target_reps, '^\s*([0-9]+)(?:\s*-\s*([0-9]+))?\s*min') AS meta
WHERE e.kind = 'strength'
  AND EXISTS (SELECT 1 FROM exercise_catalog c
              WHERE c.muscle_group = 'Cardio'
                AND (c.user_id IS NULL OR c.user_id = s.user_id)
                AND lower(c.name) = lower(trim(e.name)))
  AND NOT EXISTS (SELECT 1 FROM workout_set w
                  WHERE w.exercise_id = e.id
                    AND w.completed_at IS NOT NULL
                    AND (w.reps IS NULL OR w.reps < 1 OR w.reps > 300
                         OR w.reps > 3 * coalesce(meta[2], meta[1])::numeric));

UPDATE workout_set w SET duration_seconds = w.reps * 60
FROM cardio_esquecido c
WHERE w.exercise_id = c.id AND w.reps BETWEEN 1 AND 300 AND w.reps <= c.teto;
UPDATE session_exercise SET kind = 'cardio' WHERE id IN (SELECT id FROM cardio_esquecido);

UPDATE template_exercise te
SET muscle_group = 'Cardio'
FROM template t
WHERE t.id = te.template_id
  AND te.muscle_group IS NULL
  AND te.reps ~ '^\s*[0-9]+(\s*-\s*[0-9]+)?\s*min'
  AND EXISTS (SELECT 1 FROM exercise_catalog c
              WHERE c.muscle_group = 'Cardio'
                AND (c.user_id IS NULL OR c.user_id = t.user_id)
                AND lower(c.name) = lower(trim(te.name)));

DROP TABLE cardio_implausivel;
DROP TABLE cardio_esquecido;

-- 3. E-mail trocado perde a confirmação, mesmo se quem trocar for uma imagem anterior (rollback).
CREATE FUNCTION clear_email_verification() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.email <> OLD.email AND NEW.email_verified_at IS NOT DISTINCT FROM OLD.email_verified_at THEN
        NEW.email_verified_at := NULL;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER app_user_email_changed
    BEFORE UPDATE OF email ON app_user
    FOR EACH ROW EXECUTE FUNCTION clear_email_verification();
