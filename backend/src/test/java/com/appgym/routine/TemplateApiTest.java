package com.appgym.routine;

import static com.appgym.support.Fixtures.exercise;
import static com.appgym.support.Fixtures.template;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.support.IntegrationTest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class TemplateApiTest extends IntegrationTest {

    long create(Account account, String name) throws Exception {
        return body(perform(post("/api/templates"), account, template(name, exercise("Supino", 3, 40)))
                        .andExpect(status().isCreated()))
                .get("id")
                .asLong();
    }

    @Test
    void createsInRoutineOrderAndReorders() throws Exception {
        Account account = newAccount();
        long a = create(account, "A");
        long b = create(account, "B");
        perform(get("/api/templates"), account, null)
                .andExpect(jsonPath("$[0].name").value("A"))
                .andExpect(jsonPath("$[0].position").value(1))
                .andExpect(jsonPath("$[1].position").value(2))
                .andExpect(jsonPath("$[0].exercises[0].load").value(40.0));

        perform(put("/api/templates/order"), account, Map.of("ids", List.of(b, a)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(b));
        perform(put("/api/templates/order"), account, Map.of("ids", List.of(b))).andExpect(status().isBadRequest());
    }

    @Test
    void updateReplacesExercises() throws Exception {
        Account account = newAccount();
        long id = create(account, "A");
        perform(
                        put("/api/templates/" + id),
                        account,
                        template("A2", exercise("Remada", 2, null), exercise("Rosca", 3, 10)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("A2"))
                .andExpect(jsonPath("$.exercises.length()").value(2))
                .andExpect(jsonPath("$.exercises[1].position").value(2))
                .andExpect(jsonPath("$.exercises[1].id").isNumber());
    }

    @Test
    void validatesInput() throws Exception {
        Account account = newAccount();
        perform(post("/api/templates"), account, Map.of("name", "Sem exercícios", "exercises", List.of()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("O treino precisa ter de 1 a 30 exercícios."));
    }

    @Test
    void otherUsersCannotSeeIt() throws Exception {
        long id = create(newAccount(), "Privado");
        Account other = newAccount();
        perform(get("/api/templates/" + id), other, null).andExpect(status().isNotFound());
        perform(delete("/api/templates/" + id), other, null).andExpect(status().isNotFound());
    }

    @Test
    void deletingKeepsWorkoutHistory() throws Exception {
        Account account = newAccount();
        long id = create(account, "A");
        long session = body(perform(post("/api/sessions"), account, Map.of("templateId", id)))
                .get("id")
                .asLong();
        perform(post("/api/sessions/" + session + "/finish"), account, null).andExpect(status().isOk());

        perform(delete("/api/templates/" + id), account, null).andExpect(status().isNoContent());
        perform(get("/api/sessions/" + session), account, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("A"));
        perform(get("/api/sessions?status=finished"), account, null)
                .andExpect(jsonPath("$[0].templateId").doesNotExist());
    }

    @Test
    void templateExercisesKeepTheMuscleGroup() throws Exception {
        Account account = newAccount();
        Map<String, Object> exercise = new HashMap<>(Map.of(
                "name",
                "Puxada Frontal",
                "plannedSets",
                3,
                "reps",
                "8-12",
                "restSeconds",
                90,
                "muscleGroup",
                "Costas"));
        perform(post("/api/templates"), account, Map.of("name", "B", "exercises", List.of(exercise)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.exercises[0].muscleGroup").value("Costas"));

        exercise.put("muscleGroup", "Pescoço");
        perform(post("/api/templates"), account, Map.of("name", "C", "exercises", List.of(exercise)))
                .andExpect(status().isBadRequest());
    }
}
