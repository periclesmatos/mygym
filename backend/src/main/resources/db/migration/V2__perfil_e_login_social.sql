-- Perfil, cadastro e login com Google/Apple.
-- Idempotente: em bancos onde o Hibernate (ddl-auto: update) já criou estas colunas, nada muda.

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS password_set boolean,
    ADD COLUMN IF NOT EXISTS name         varchar(80),
    ADD COLUMN IF NOT EXISTS weight_kg    numeric(5, 2),
    ADD COLUMN IF NOT EXISTS height_cm    integer,
    ADD COLUMN IF NOT EXISTS birth_date   date,
    ADD COLUMN IF NOT EXISTS created_at   timestamp(6) with time zone,
    ADD COLUMN IF NOT EXISTS google_sub   varchar(255),
    ADD COLUMN IF NOT EXISTS apple_sub    varchar(255);

-- Unicidade do vínculo com cada provedor, se ainda não houver uma.
DO $$
DECLARE
    col text;
BEGIN
    FOREACH col IN ARRAY ARRAY['google_sub', 'apple_sub'] LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
            WHERE i.indrelid = 'app_user'::regclass
              AND i.indisunique
              AND i.indnatts = 1
              AND a.attname = col
        ) THEN
            EXECUTE format('ALTER TABLE app_user ADD CONSTRAINT app_user_%s_key UNIQUE (%I)', col, col);
        END IF;
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS user_photo (
    user_id      bigint PRIMARY KEY,
    content_type varchar(40)                 NOT NULL,
    data         bytea                       NOT NULL,
    updated_at   timestamp(6) with time zone NOT NULL
);
