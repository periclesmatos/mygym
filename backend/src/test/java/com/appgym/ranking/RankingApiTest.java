package com.appgym.ranking;

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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class RankingApiTest extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void newAccountStartsAtTheBottom() throws Exception {
        perform(get("/api/ranking"), newAccount(), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points").value(0))
                .andExpect(jsonPath("$.rank.label").value("Frango I"))
                .andExpect(jsonPath("$.pointsToNext").value(150));
    }

    @Test
    void strengthAndCardioScoreAndAreIsolatedByAccount() throws Exception {
        Account account = newAccount();
        long strength = strength(account, 15);
        perform(get("/api/ranking"), account, null)
                .andExpect(jsonPath("$.points").value(75));
        long cardio = cardio(account, null);
        perform(get("/api/ranking"), account, null)
                .andExpect(jsonPath("$.points").value(100));
        perform(get("/api/ranking/impact/" + cardio), account, null)
                .andExpect(jsonPath("$.status").value("SCORED"))
                .andExpect(jsonPath("$.points").value(25));
        perform(get("/api/ranking/details"), account, null)
                .andExpect(jsonPath("$.ladder.length()").value(23))
                .andExpect(jsonPath("$.history.length()").value(90))
                .andExpect(jsonPath("$.days[0].total").value(100));

        Account other = newAccount();
        perform(get("/api/ranking"), other, null).andExpect(jsonPath("$.points").value(0));
        perform(get("/api/ranking/impact/" + strength), other, null).andExpect(status().isNotFound());
    }

    @Test
    void oldWorkoutNeitherScoresNorCanBeMovedToToday() throws Exception {
        Account account = newAccount();
        Instant old = Instant.now().minus(20, ChronoUnit.DAYS);
        long id = cardio(account, old);
        perform(get("/api/ranking/impact/" + id), account, null)
                .andExpect(jsonPath("$.status").value("LATE"));

        perform(get("/api/ranking"), account, null)
                .andExpect(jsonPath("$.points").value(0));

        // Um treino do histórico, com e sem registro gravado, movido para hoje.
        for (String recorded : List.of("finished_at", "null")) {
            long moved = cardio(account, old);
            jdbc.update("update workout_session set recorded_at = " + recorded + " where id = ?", moved);
            Instant now = Instant.now();
            perform(
                            put("/api/sessions/" + moved + "/period"),
                            account,
                            Map.of("startedAt", now.minusSeconds(1200).toString(), "finishedAt", now.toString()))
                    .andExpect(status().isOk());
            perform(get("/api/ranking/impact/" + moved), account, null)
                    .andExpect(jsonPath("$.status").value("LATE"));
        }
    }

    @Test
    void deletingTheWorkoutTakesTheTrophyBack() throws Exception {
        Account account = newAccount();
        long id = strength(account, 5);
        perform(get("/api/ranking/impact/" + id), account, null)
                .andExpect(jsonPath("$.trophies[0].name").value("Primeiro Passo"));
        perform(get("/api/ranking/trophies"), account, null)
                .andExpect(jsonPath("$.length()").value(36))
                .andExpect(jsonPath("$[0].achievedOn").isNotEmpty());
        perform(delete("/api/sessions/" + id), account, null).andExpect(status().isNoContent());
        perform(get("/api/ranking/trophies"), account, null)
                .andExpect(jsonPath("$[0].achievedOn").doesNotExist());
    }

    @Test
    void finishingTwiceIsRefused() throws Exception {
        Account account = newAccount();
        long id = strength(account, 5);
        perform(post("/api/sessions/" + id + "/finish"), account, null).andExpect(status().isConflict());
    }

    private long strength(Account account, int sets) throws Exception {
        Map<String, Object> exercise = Map.of("name", "Supino", "plannedSets", sets, "reps", "10", "restSeconds", 0);
        JsonNode session =
                body(perform(post("/api/sessions"), account, Map.of("name", "A", "exercises", List.of(exercise))));
        long id = session.get("id").asLong();
        for (JsonNode set : session.get("exercises").get(0).get("sets")) {
            perform(
                            put("/api/sessions/" + id + "/sets/" + set.get("id").asLong()),
                            account,
                            Map.of("reps", 10, "load", 40, "completed", true))
                    .andExpect(status().isOk());
        }
        perform(post("/api/sessions/" + id + "/finish"), account, null).andExpect(status().isOk());
        return id;
    }

    private long cardio(Account account, Instant end) throws Exception {
        Map<String, Object> body = new HashMap<>(Map.of(
                "name",
                "Corrida",
                "durationSeconds",
                1200,
                "intensity",
                "moderate",
                "clientKey",
                UUID.randomUUID().toString()));
        if (end != null) body.put("finishedAt", end.toString());
        return body(perform(post("/api/sessions/cardio"), account, body).andExpect(status().isCreated()))
                .get("id")
                .asLong();
    }
}
