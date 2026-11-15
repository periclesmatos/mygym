package com.appgym.identity;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.identity.domain.User;
import com.appgym.support.IntegrationTest;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ProfileApiTest extends IntegrationTest {
    private static final String PNG =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    @Test
    void updatesBodyData() throws Exception {
        Account account = newAccount();
        perform(
                        put("/api/profile"),
                        account,
                        Map.of("name", "  Ana Lima ", "weightKg", 70.456, "heightCm", 170, "birthDate", "1995-01-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Ana Lima"))
                .andExpect(jsonPath("$.weightKg").value(70.46))
                .andExpect(jsonPath("$.birthDate").value("1995-01-02"));

        perform(put("/api/profile"), account, Map.of("weightKg", 5))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Peso deve ficar entre 20 e 400 kg."));
        perform(put("/api/profile"), account, Map.of("birthDate", "2999-01-01")).andExpect(status().isBadRequest());
    }

    @Test
    void uploadsAndRemovesPhoto() throws Exception {
        Account account = newAccount();
        perform(put("/api/profile/photo"), account, Map.of("dataUrl", PNG))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photo").value(PNG));
        perform(put("/api/profile/photo"), account, Map.of("dataUrl", "data:text/html;base64,PGI+"))
                .andExpect(status().isBadRequest());
        perform(delete("/api/profile/photo"), account, null).andExpect(status().isNoContent());
        perform(get("/api/profile"), account, null)
                .andExpect(jsonPath("$.photo").doesNotExist());
    }

    @Test
    void changesPasswordWithCurrentOne() throws Exception {
        Account account = newAccount();
        perform(put("/api/profile/password"), account, Map.of("currentPassword", "x", "newPassword", "nova-senha"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Senha atual incorreta."));
        perform(
                        put("/api/profile/password"),
                        account,
                        Map.of("currentPassword", "senha123", "newPassword", "nova-senha"))
                .andExpect(status().isNoContent());
        perform(post("/api/auth/login"), null, Map.of("email", account.email(), "password", "nova-senha"))
                .andExpect(status().isOk());
    }

    @Test
    void changesEmailAndReturnsNewToken() throws Exception {
        Account account = newAccount();
        Account other = newAccount();
        perform(put("/api/profile/email"), account, Map.of("email", other.email(), "currentPassword", "senha123"))
                .andExpect(status().isBadRequest());

        String email = "novo-" + account.email();
        perform(put("/api/profile/email"), account, Map.of("email", email.toUpperCase(), "currentPassword", "senha123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.token").isNotEmpty());
        perform(post("/api/auth/login"), null, Map.of("email", email, "password", "senha123"))
                .andExpect(status().isOk());
    }

    @Test
    void socialOnlyAccountSetsPasswordWithoutCurrentOne() throws Exception {
        Account account = newAccount();
        User user = users.findByEmail(account.email()).orElseThrow();
        user.setPasswordSet(false);
        users.save(user);

        perform(
                        put("/api/profile/email"),
                        account,
                        Map.of("email", "x" + account.email(), "currentPassword", "senha123"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Defina uma senha antes de trocar o e-mail."));

        Map<String, Object> body = new HashMap<>();
        body.put("currentPassword", null);
        body.put("newPassword", "primeira-senha");
        perform(put("/api/profile/password"), account, body).andExpect(status().isNoContent());
        perform(get("/api/profile"), account, null)
                .andExpect(jsonPath("$.hasPassword").value(true));
    }
}
