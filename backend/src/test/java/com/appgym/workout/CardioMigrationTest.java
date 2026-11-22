package com.appgym.workout;

import static org.assertj.core.api.Assertions.assertThat;

import com.appgym.support.IntegrationTest;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/** Sobe um schema até a V6, põe dados no formato antigo e migra para a V7. */
class CardioMigrationTest extends IntegrationTest {
    private static final String SCHEMA = "legado_cardio";

    @Autowired
    DataSource dataSource;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void convertsOnlySafeLegacyCardio() {
        migrate("6");
        jdbc.execute("insert into legado_cardio.app_user (id, email, password_hash) values (900, 'a@x', 'h')");
        jdbc.execute("insert into legado_cardio.workout_session (id, user_id, name, started_at, finished_at)"
                + " values (900, 900, 'Antigo', now(), now())");
        exercise(901, "Esteira", "20 min", 25);
        exercise(902, "Remo", "20 min", 20);
        exercise(903, "Escada", "10-12", 12);
        exercise(904, "Elíptico", "20 min", 900);
        exercise(905, "Esteira", "20-30 min", 30);

        migrate("7");

        assertThat(jdbc.queryForList(
                        "select id from legado_cardio.session_exercise where kind = 'cardio' order by id", Long.class))
                .containsExactly(901L, 905L);
        assertThat(jdbc.queryForMap("select reps, duration_seconds from legado_cardio.workout_set where id = 901"))
                .containsEntry("reps", 25)
                .containsEntry("duration_seconds", 1500);
    }

    private void exercise(long id, String name, String target, int reps) {
        jdbc.update(
                "insert into legado_cardio.session_exercise"
                        + " (id, session_id, name, position, rest_seconds, target_reps) values (?, 900, ?, 1, 0, ?)",
                id,
                name,
                target);
        jdbc.update(
                "insert into legado_cardio.workout_set (id, exercise_id, position, reps, completed_at)"
                        + " values (?, ?, 1, ?, now())",
                id,
                id,
                reps);
    }

    private void migrate(String version) {
        Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .target(version)
                .load()
                .migrate();
    }
}
