-- Ajustes de schema da reestruturação.

-- 1. Cargas: versões antigas gravavam em workout_set.load; a atual em "carga".
--    Recupera o que só existe na coluna antiga e remove essa coluna.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'workout_set' AND column_name = 'load') THEN
        UPDATE workout_set SET carga = load WHERE carga IS NULL AND load IS NOT NULL;
        ALTER TABLE workout_set DROP COLUMN load;
    END IF;
END $$;

-- 2. Nome em inglês, como as demais colunas.
ALTER TABLE workout_set RENAME COLUMN carga TO load_kg;

-- 3. Posição na rotina para treinos antigos que ainda não tinham.
WITH ordered AS (
    SELECT id,
           row_number() OVER (PARTITION BY user_id ORDER BY "position" NULLS LAST, created_at, id) AS pos
    FROM template
    WHERE user_id IN (SELECT user_id FROM template WHERE "position" IS NULL)
)
UPDATE template t SET "position" = o.pos FROM ordered o WHERE t.id = o.id;

-- 4. Apagar um treino da rotina mantém o histórico: as sessões só perdem o vínculo.
DO $$
DECLARE
    fk text;
BEGIN
    FOR fk IN
        SELECT c.conname FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = 'workout_session'::regclass AND c.contype = 'f' AND a.attname = 'template_id'
    LOOP
        EXECUTE format('ALTER TABLE workout_session DROP CONSTRAINT %I', fk);
    END LOOP;
END $$;
ALTER TABLE workout_session
    ADD CONSTRAINT fk_workout_session_template FOREIGN KEY (template_id) REFERENCES template (id) ON DELETE SET NULL;

-- 5. A foto pertence ao usuário.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conrelid = 'user_photo'::regclass AND contype = 'f') THEN
        DELETE FROM user_photo WHERE user_id NOT IN (SELECT id FROM app_user);
        ALTER TABLE user_photo
            ADD CONSTRAINT fk_user_photo_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Índices nas chaves estrangeiras usadas nas consultas.
CREATE INDEX IF NOT EXISTS idx_template_user ON template (user_id);
CREATE INDEX IF NOT EXISTS idx_template_exercise_template ON template_exercise (template_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_user ON workout_session (user_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_template ON workout_session (template_id);
CREATE INDEX IF NOT EXISTS idx_session_exercise_session ON session_exercise (session_id);
CREATE INDEX IF NOT EXISTS idx_workout_set_exercise ON workout_set (exercise_id);

-- 7. Tabelas de uma versão antiga, em português, que o app não usa mais. Só são apagadas se estiverem vazias.
DO $$
DECLARE
    legacy text[] := ARRAY['serie', 'exercicio_sessao', 'sessao', 'exercicio_ficha', 'ficha'];
    tbl text;
    has_rows boolean := false;
    found_rows boolean;
BEGIN
    FOREACH tbl IN ARRAY legacy LOOP
        IF to_regclass(tbl) IS NOT NULL THEN
            EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I)', tbl) INTO found_rows;
            has_rows := has_rows OR found_rows;
        END IF;
    END LOOP;
    IF has_rows THEN
        RAISE NOTICE 'Tabelas antigas têm dados; mantidas: %', legacy;
    ELSE
        DROP TABLE IF EXISTS serie, exercicio_sessao, sessao, exercicio_ficha, ficha;
    END IF;
END $$;
