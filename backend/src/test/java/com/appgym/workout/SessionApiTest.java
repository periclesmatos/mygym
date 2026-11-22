package com.appgym.workout;

import static com.appgym.support.Fixtures.exercise;
import static com.appgym.support.Fixtures.template;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.junit.jupiter.api.Test;

class SessionApiTest extends IntegrationTest {

    JsonNode startFromTemplate(Account account) throws Exception {
        long templateId = body(perform(post("/api/templates"), account, template("Peito", exercise("Supino", 2, 40))))
                .get("id")
                .asLong();
        return body(perform(post("/api/sessions"), account, Map.of("templateId", templateId))
                .andExpect(status().isCreated()));
    }

    @Test
    void startsFromTemplateWithPlannedSets() throws Exception {
        Account account = newAccount();
        JsonNode session = startFromTemplate(account);
        assertThat(session.at("/exercises/0/sets").size()).isEqualTo(2);
        assertThat(session.at("/exercises/0/sets/0/load").asDouble()).isEqualTo(40.0);

        perform(post("/api/sessions"), account, Map.of("name", "Outro"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Encerre o treino atual antes de começar outro."));
    }

    @Test
    void recordsSetsAndFinishes() throws Exception {
        Account account = newAccount();
        JsonNode session = startFromTemplate(account);
        long id = session.get("id").asLong();
        long exerciseId = session.at("/exercises/0/id").asLong();
        long firstSet = session.at("/exercises/0/sets/0/id").asLong();

        perform(
                        put("/api/sessions/" + id + "/sets/" + firstSet),
                        account,
                        Map.of("reps", 10, "load", 42.5, "rir", 2, "completed", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exercises[0].sets[0].completedAt").isNotEmpty());

        // Série nova repete a carga da anterior.
        perform(post("/api/sessions/" + id + "/exercises/" + exerciseId + "/sets"), account, null)
                .andExpect(jsonPath("$.exercises[0].sets.length()").value(3))
                .andExpect(jsonPath("$.exercises[0].sets[2].load").value(40.0));

        // Remover renumera as séries.
        JsonNode current = body(perform(get("/api/sessions/" + id), account, null));
        long second = current.at("/exercises/0/sets/1/id").asLong();
        perform(delete("/api/sessions/" + id + "/sets/" + second), account, null)
                .andExpect(jsonPath("$.exercises[0].sets.length()").value(2))
                .andExpect(jsonPath("$.exercises[0].sets[1].position").value(2));

        perform(get("/api/sessions?status=open"), account, null)
                .andExpect(jsonPath("$[0].completedSets").value(1))
                .andExpect(jsonPath("$[0].totalSets").value(2))
                .andExpect(jsonPath("$[0].volume").value(425.0));

        perform(post("/api/sessions/" + id + "/finish"), account, null).andExpect(status().isOk());
        perform(post("/api/sessions/" + id + "/finish"), account, null).andExpect(status().isConflict());
        perform(get("/api/sessions?status=finished"), account, null)
                .andExpect(jsonPath("$[0].durationSeconds").isNumber());

        perform(get("/api/exercises/last?names=supino"), account, null)
                .andExpect(jsonPath("$.supino.topLoad").value(42.5))
                .andExpect(jsonPath("$.supino.estimatedMax").value(56.7));
        perform(get("/api/exercises/progress?name=Supino"), account, null)
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void addsAndRemovesExercisesInOpenWorkout() throws Exception {
        Account account = newAccount();
        long id = body(perform(post("/api/sessions"), account, Map.of("name", "  ")))
                .get("id")
                .asLong();
        JsonNode added =
                body(perform(post("/api/sessions/" + id + "/exercises"), account, exercise("Agachamento", 3, 60))
                        .andExpect(jsonPath("$.name").value("Treino avulso"))
                        .andExpect(jsonPath("$.exercises[0].sets.length()").value(3)));
        long exerciseId = added.at("/exercises/0/id").asLong();
        perform(delete("/api/sessions/" + id + "/exercises/" + exerciseId), account, null)
                .andExpect(jsonPath("$.exercises.length()").value(0));
        perform(delete("/api/sessions/" + id), account, null).andExpect(status().isNoContent());
        perform(get("/api/sessions/" + id), account, null).andExpect(status().isNotFound());
    }

    @Test
    void reportsBadRequestsClearly() throws Exception {
        Account account = newAccount();
        perform(get("/api/sessions?status=x"), account, null).andExpect(status().isBadRequest());
        perform(get("/api/sessions"), account, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Parâmetro obrigatório ausente: status."));
        perform(get("/api/sessions/abc"), account, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valor inválido para id."));
        perform(get("/api/nao-existe"), account, null).andExpect(status().isNotFound());
    }

    /** Registra um treino passado de uma série e uma hora. */
    long recordPast(Account account, Instant start, int load) throws Exception {
        JsonNode session = body(perform(
                        post("/api/sessions"),
                        account,
                        Map.of("startedAt", start.toString(), "exercises", new Object[] {exercise("Supino", 1, load)}))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.backdated").value(true))
                .andExpect(jsonPath("$.startedAt").value(start.toString())));
        long id = session.get("id").asLong();
        long set = session.at("/exercises/0/sets/0/id").asLong();
        perform(
                        put("/api/sessions/" + id + "/sets/" + set),
                        account,
                        Map.of("reps", 10, "load", load, "completed", true))
                .andExpect(status().isOk());
        String end = start.plus(1, ChronoUnit.HOURS).toString();
        perform(post("/api/sessions/" + id + "/finish"), account, Map.of("finishedAt", end))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.finishedAt").value(end));
        return id;
    }

    static Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
    }

    @Test
    void recordsPastWorkoutsInTheOrderTheyHappened() throws Exception {
        Account account = newAccount();
        long recent = recordPast(account, daysAgo(2), 60);
        long older = recordPast(account, daysAgo(9), 50);

        perform(get("/api/sessions?status=finished"), account, null)
                .andExpect(jsonPath("$[0].id").value(recent))
                .andExpect(jsonPath("$[0].durationSeconds").value(3600))
                .andExpect(jsonPath("$[1].id").value(older));
        perform(get("/api/exercises/last?names=supino"), account, null)
                .andExpect(jsonPath("$.supino.topLoad").value(60.0));
        perform(get("/api/exercises/last?names=supino&before=" + daysAgo(5)), account, null)
                .andExpect(jsonPath("$.supino.topLoad").value(50.0));
        perform(get("/api/exercises/last?names=supino&before=" + daysAgo(20)), account, null)
                .andExpect(jsonPath("$.supino").doesNotExist());

        // Mover o mais antigo para ontem muda a ordem do histórico.
        Instant moved = daysAgo(1);
        Map<String, String> period = Map.of(
                "startedAt", moved.toString(),
                "finishedAt", moved.plus(1, ChronoUnit.HOURS).toString());
        perform(put("/api/sessions/" + older + "/period"), account, period).andExpect(status().isOk());
        perform(get("/api/sessions?status=finished"), account, null)
                .andExpect(jsonPath("$[0].id").value(older));
    }

    @Test
    void backdatedWorkoutNeedsAnEndAndKeepsOneOpenAtATime() throws Exception {
        Account account = newAccount();
        Map<String, String> past = Map.of("startedAt", daysAgo(3).toString());
        long id = body(perform(post("/api/sessions"), account, past)).get("id").asLong();
        perform(post("/api/sessions"), account, past).andExpect(status().isConflict());
        perform(post("/api/sessions/" + id + "/finish"), account, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Informe quando o treino terminou."));
    }

    @Test
    void finishesForgottenWorkoutAtTheRealTime() throws Exception {
        Account account = newAccount();
        long id = startFromTemplate(account).get("id").asLong();
        Instant start = daysAgo(1);
        Instant end = start.plus(50, ChronoUnit.MINUTES);
        Map<String, String> period = Map.of("startedAt", start.toString(), "finishedAt", end.toString());
        perform(put("/api/sessions/" + id + "/period"), account, period).andExpect(status().isConflict());
        perform(post("/api/sessions/" + id + "/finish"), account, period)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backdated").value(false))
                .andExpect(jsonPath("$.startedAt").value(start.toString()))
                .andExpect(jsonPath("$.finishedAt").value(end.toString()));
    }

    @Test
    void rejectsInvalidOrForeignPeriods() throws Exception {
        Account account = newAccount();
        String future = Instant.now().plus(1, ChronoUnit.HOURS).toString();
        perform(post("/api/sessions"), account, Map.of("startedAt", future)).andExpect(status().isBadRequest());

        Instant start = daysAgo(4);
        long id = recordPast(account, start, 40);
        String path = "/api/sessions/" + id + "/period";
        perform(put(path), account, Map.of("startedAt", start.toString())).andExpect(status().isBadRequest());
        perform(put(path), account, Map.of("startedAt", start.toString(), "finishedAt", start.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O fim precisa ser depois do início."));
        Map<String, String> valid = Map.of(
                "startedAt", start.toString(),
                "finishedAt", start.plus(2, ChronoUnit.HOURS).toString());
        perform(put(path), newAccount(), valid).andExpect(status().isNotFound());
    }

    @Test
    void workoutsArePrivate() throws Exception {
        long id = startFromTemplate(newAccount()).get("id").asLong();
        Account other = newAccount();
        perform(get("/api/sessions/" + id), other, null).andExpect(status().isNotFound());
        perform(get("/api/sessions?status=open"), other, null)
                .andExpect(jsonPath("$.length()").value(0));
    }
}
