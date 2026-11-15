package com.appgym.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.support.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Test;

class CatalogApiTest extends IntegrationTest {

    JsonNode find(JsonNode list, String name) {
        return StreamSupport.stream(list.spliterator(), false)
                .filter(item -> item.get("name").asText().equals(name))
                .findFirst()
                .orElse(null);
    }

    @Test
    void listsAppExercisesWithSuggestions() throws Exception {
        JsonNode list =
                body(perform(get("/api/exercises/catalog"), newAccount(), null).andExpect(status().isOk()));
        assertThat(list.size()).isGreaterThan(100);
        JsonNode supino = find(list, "Supino Reto com Barra");
        assertThat(supino.get("muscleGroup").asText()).isEqualTo("Peito");
        assertThat(supino.get("secondaryGroups").get(0).asText()).isEqualTo("Tríceps");
        assertThat(supino.get("aliases").toString()).contains("supino reto");
        assertThat(supino.get("restSeconds").asInt()).isEqualTo(150);
        assertThat(supino.get("custom").asBoolean()).isFalse();
    }

    @Test
    void createsCustomExercisesVisibleOnlyToTheOwner() throws Exception {
        Account account = newAccount();
        JsonNode created = body(perform(
                        post("/api/exercises/catalog"),
                        account,
                        Map.of(
                                "name",
                                "  Remada  Pronada Unilateral ",
                                "muscleGroup",
                                "costas",
                                "equipment",
                                "maquina"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Remada Pronada Unilateral"))
                .andExpect(jsonPath("$.muscleGroup").value("Costas"))
                .andExpect(jsonPath("$.equipment").value("Máquina"))
                .andExpect(jsonPath("$.custom").value(true)));

        assertThat(find(body(perform(get("/api/exercises/catalog"), account, null)), "Remada Pronada Unilateral"))
                .isNotNull();
        Account other = newAccount();
        assertThat(find(body(perform(get("/api/exercises/catalog"), other, null)), "Remada Pronada Unilateral"))
                .isNull();
        perform(delete("/api/exercises/catalog/" + created.get("id").asLong()), other, null)
                .andExpect(status().isNotFound());
        perform(delete("/api/exercises/catalog/" + created.get("id").asLong()), account, null)
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsDuplicatesAndInvalidGroups() throws Exception {
        Account account = newAccount();
        perform(
                        post("/api/exercises/catalog"),
                        account,
                        Map.of("name", "supino reto com barra", "muscleGroup", "Peito"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Esse exercício já está na lista."));
        perform(post("/api/exercises/catalog"), account, Map.of("name", "Novo", "muscleGroup", "Pescoço"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Grupo muscular inválido."));
        long appExercise = find(body(perform(get("/api/exercises/catalog"), account, null)), "Crossover")
                .get("id")
                .asLong();
        perform(delete("/api/exercises/catalog/" + appExercise), account, null).andExpect(status().isNotFound());
    }
}
