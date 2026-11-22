package com.appgym.workout;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class CardioApiTest extends IntegrationTest {

    @Test
    void quickLogIsIdempotentAndWorksWithOpenWorkout() throws Exception {
        Account account = newAccount();
        perform(post("/api/sessions"), account, Map.of("name", "Aberto")).andExpect(status().isCreated());
        Map<String, Object> body = Map.of(
                "name",
                "Corrida",
                "durationSeconds",
                1800,
                "distanceMeters",
                5000,
                "intensity",
                "moderate",
                "clientKey",
                UUID.randomUUID().toString());
        JsonNode first =
                body(perform(post("/api/sessions/cardio"), account, body).andExpect(status().isCreated()));
        JsonNode again =
                body(perform(post("/api/sessions/cardio"), account, body).andExpect(status().isCreated()));

        assertThat(again.get("id")).isEqualTo(first.get("id"));
        perform(get("/api/sessions?status=finished"), account, null)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].cardioSeconds").value(1800))
                .andExpect(jsonPath("$[0].volume").value(0));
        perform(get("/api/exercises/progress?name=Corrida"), account, null)
                .andExpect(jsonPath("$[0].cardio").value(true))
                .andExpect(jsonPath("$[0].distanceMeters").value(5000));
    }

    @Test
    void routineCardioIsMeasuredInMinutes() throws Exception {
        Account account = newAccount();
        Map<String, Object> exercise = Map.of(
                "name", "Esteira", "plannedSets", 1, "reps", "20 min", "restSeconds", 0, "muscleGroup", "Cardio");
        long template = body(perform(
                        post("/api/templates"), account, Map.of("name", "A", "exercises", List.of(exercise))))
                .get("id")
                .asLong();
        JsonNode session = body(perform(post("/api/sessions"), account, Map.of("templateId", template)));
        JsonNode created = session.get("exercises").get(0);
        assertThat(created.get("cardio").asBoolean()).isTrue();

        String set = "/api/sessions/" + session.get("id").asLong() + "/sets/"
                + created.get("sets").get(0).get("id").asLong();
        perform(put(set), account, Map.of("completed", true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Informe quantos minutos durou."));
        perform(put(set), account, Map.of("reps", 25, "completed", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exercises[0].sets[0].durationSeconds").value(1500));
    }

    @Test
    void cardioGroupWithRepTargetStaysStrength() throws Exception {
        Account account = newAccount();
        Map<String, Object> rowing =
                Map.of("name", "Remo", "plannedSets", 3, "reps", "8-12", "restSeconds", 90, "muscleGroup", "Cardio");
        long template = body(perform(
                        post("/api/templates"), account, Map.of("name", "B", "exercises", List.of(rowing))))
                .get("id")
                .asLong();
        perform(post("/api/sessions"), account, Map.of("templateId", template))
                .andExpect(jsonPath("$.exercises[0].cardio").value(false));
    }

    @Test
    void newActivitiesAreInTheCatalog() throws Exception {
        assertThat(body(perform(get("/api/exercises/catalog"), newAccount(), null))
                        .toString())
                .contains("Corrida", "Caminhada", "Outro cardio");
    }
}
