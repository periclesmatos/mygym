package com.appgym.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.support.IntegrationTest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

class AuthApiTest extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void initialUserIsCreatedOnEmptyDatabase() throws Exception {
        perform(post("/api/auth/login"), null, Map.of("email", "INICIAL@teste.local ", "password", "senha-inicial"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("inicial@teste.local"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void wrongPasswordIsRejected() throws Exception {
        perform(post("/api/auth/login"), null, Map.of("email", "inicial@teste.local", "password", "errada"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("E-mail ou senha inválidos."));
    }

    @Test
    void registerOnlyForInvitedEmails() throws Exception {
        perform(post("/api/auth/register"), null, Map.of("email", "estranho@teste.local", "password", "abcdef"))
                .andExpect(status().isForbidden());

        perform(
                        post("/api/auth/register"),
                        null,
                        Map.of("name", " Bea ", "email", "Convidado@teste.local", "password", "abcdef"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("convidado@teste.local"));

        perform(post("/api/auth/register"), null, Map.of("email", "convidado@teste.local", "password", "abcdef"))
                .andExpect(status().isBadRequest());
        assertThat(users.findByEmail("convidado@teste.local"))
                .get()
                .extracting("name")
                .isEqualTo("Bea");
    }

    @Test
    void registerValidatesPassword() throws Exception {
        perform(post("/api/auth/register"), null, Map.of("email", "outro-convidado@teste.local", "password", "123"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A senha precisa ter de 6 a 100 caracteres."));
    }

    @Test
    void configHidesUnconfiguredProviders() throws Exception {
        perform(get("/api/auth/config"), null, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.googleClientId").doesNotExist())
                .andExpect(jsonPath("$.appleClientId").doesNotExist());
        perform(post("/api/auth/google"), null, Map.of("credential", "x"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Login com Google não está configurado."));
    }

    @Test
    void protectedRoutesNeedValidToken() throws Exception {
        perform(get("/api/profile"), null, null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Não autenticado."));
        perform(get("/api/profile"), new Account("x", "token-invalido"), null).andExpect(status().isUnauthorized());
    }

    @Test
    void migrationsAreApplied() {
        assertThat(jdbc.queryForList("select version from flyway_schema_history where success", String.class))
                .contains("1", "2", "3", "4");
    }
}
