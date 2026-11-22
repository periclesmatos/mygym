-- Cardio com minutos, distância e intensidade, em vez de repetições.

-- 1. Tipo do exercício no treino e o que se mede no cardio.
ALTER TABLE session_exercise
    ADD COLUMN kind varchar(10) NOT NULL DEFAULT 'strength' CHECK (kind IN ('strength', 'cardio'));
ALTER TABLE workout_set
    ADD COLUMN duration_seconds integer CHECK (duration_seconds BETWEEN 1 AND 86400),
    ADD COLUMN distance_meters  integer CHECK (distance_meters BETWEEN 0 AND 1000000),
    ADD COLUMN intensity        varchar(10) CHECK (intensity IN ('light', 'moderate', 'intense'));

-- 2. Evita cardio rápido duplicado quando o envio é repetido.
ALTER TABLE workout_session ADD COLUMN client_key varchar(40);
CREATE UNIQUE INDEX uk_workout_session_client_key ON workout_session (user_id, client_key);

-- 3. Histórico: só nome exato de cardio (do app ou do dono), meta em minutos e reps plausíveis.
--    As reps ficam como estavam, para dar para voltar atrás. Intensidade nula conta como leve.
UPDATE session_exercise e
SET kind = 'cardio'
FROM workout_session s
WHERE s.id = e.session_id
  AND e.target_reps ~ '^\s*[0-9]+(\s*-\s*[0-9]+)?\s*min'
  AND EXISTS (SELECT 1 FROM exercise_catalog c
              WHERE c.muscle_group = 'Cardio'
                AND (c.user_id IS NULL OR c.user_id = s.user_id)
                AND lower(c.name) = lower(trim(e.name)))
  AND NOT EXISTS (SELECT 1 FROM workout_set w
                  WHERE w.exercise_id = e.id
                    AND w.completed_at IS NOT NULL
                    AND (w.reps IS NULL OR w.reps NOT BETWEEN 1 AND 300));

UPDATE workout_set w
SET duration_seconds = w.reps * 60
FROM session_exercise e
WHERE e.id = w.exercise_id AND e.kind = 'cardio' AND w.reps BETWEEN 1 AND 300;

-- 4. Na rotina o tipo vem do grupo muscular, então só falta o grupo de quem está sem.
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

-- 5. Corrida e caminhada deixam de ser apelido de Esteira.
UPDATE exercise_catalog SET aliases = 'treadmill' WHERE user_id IS NULL AND name = 'Esteira';
INSERT INTO exercise_catalog (name, aliases, muscle_group, secondary_groups, equipment, kind, planned_sets, reps, rest_seconds) VALUES
    ('Corrida', 'correr|corrida de rua|cooper', 'Cardio', NULL, 'Outro', 'cardio', 1, '30 min', 0),
    ('Caminhada', 'caminhar|andar', 'Cardio', NULL, 'Outro', 'cardio', 1, '30 min', 0),
    ('Ciclismo', 'pedal|pedalar', 'Cardio', NULL, 'Outro', 'cardio', 1, '45 min', 0),
    ('Natação', 'nadar|piscina', 'Cardio', NULL, 'Outro', 'cardio', 1, '30 min', 0),
    ('Trilha', 'hiking', 'Cardio', NULL, 'Outro', 'cardio', 1, '60 min', 0),
    ('HIIT', 'intervalado', 'Cardio', NULL, 'Outro', 'cardio', 1, '20 min', 0),
    ('Dança', 'dançar|zumba', 'Cardio', NULL, 'Outro', 'cardio', 1, '45 min', 0),
    ('Outro cardio', 'aeróbico', 'Cardio', NULL, 'Outro', 'cardio', 1, '30 min', 0);
