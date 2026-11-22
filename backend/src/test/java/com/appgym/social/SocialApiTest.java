package com.appgym.social;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.identity.domain.User;
import com.appgym.support.IntegrationTest;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SocialApiTest extends IntegrationTest {

    @Test
    void crossedRequestsBecomeFriendship() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        request(ana, bea);
        perform(get("/api/social/pending"), bea, null)
                .andExpect(jsonPath("$.count").value(1));
        perform(get("/api/social/friends/" + id(bea)), ana, null).andExpect(status().isNotFound());
        request(bea, ana);
        perform(get("/api/social/friends/" + id(bea)), ana, null).andExpect(status().isOk());
        perform(get("/api/social"), ana, null)
                .andExpect(jsonPath("$.board.length()").value(2))
                .andExpect(jsonPath("$.sent.length()").value(0));
    }

    @Test
    void acceptDeclineAndRemove() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        request(ana, bea);
        perform(post("/api/social/requests/" + id(bea) + "/accept"), ana, null).andExpect(status().isNotFound());
        perform(post("/api/social/requests/" + id(ana) + "/accept"), bea, null).andExpect(status().isNoContent());
        perform(get("/api/social/friends/" + id(ana)), bea, null).andExpect(status().isOk());
        perform(delete("/api/social/relations/" + id(ana)), bea, null).andExpect(status().isNoContent());
        perform(get("/api/social/friends/" + id(bea)), ana, null).andExpect(status().isNotFound());
    }

    @Test
    void friendNeverSeesPrivateData() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        perform(put("/api/profile"), bea, Map.of("weightKg", 63.37, "heightCm", 171, "birthDate", "1995-01-02"));
        perform(put("/api/profile/discovery"), bea, Map.of("phone", "(11) 98765-4321", "emailSearchable", true))
                .andExpect(status().isOk());
        request(ana, bea);
        request(bea, ana);
        String seen =
                body(perform(get("/api/social/friends/" + id(bea)), ana, null)).toString()
                        + body(perform(get("/api/social"), ana, null));
        assertThat(seen)
                .doesNotContain(bea.email(), "98765", "63.37", "1995-01-02")
                .doesNotContain("weightKg", "heightCm", "birthDate", "email", "phone", "volume", "load\"");
    }

    @Test
    void blockedLooksLikeNonexistent() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        String username = "bea" + suffix();
        perform(put("/api/profile/username"), bea, Map.of("username", username)).andExpect(status().isOk());
        request(ana, bea);
        perform(post("/api/social/blocks/" + id(ana)), bea, null).andExpect(status().isNoContent());

        perform(post("/api/social/search"), ana, Map.of("query", username))
                .andExpect(jsonPath("$.length()").value(0));
        String blocked = body(perform(post("/api/social/requests/" + id(bea)), ana, null))
                .toString();
        String missing = body(perform(post("/api/social/requests/" + UUID.randomUUID()), ana, null))
                .toString();
        assertThat(blocked).isEqualTo(missing);
        perform(get("/api/social/users/" + id(bea) + "/photo"), ana, null).andExpect(status().isNotFound());
        perform(get("/api/social"), bea, null)
                .andExpect(jsonPath("$.blocked.length()").value(1));
        perform(delete("/api/social/blocks/" + id(ana)), bea, null).andExpect(status().isNoContent());
        perform(post("/api/social/search"), ana, Map.of("query", username))
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void usernameSearchesByPrefixWithoutWildcards() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        String username = "pre" + suffix();
        perform(put("/api/profile/username"), bea, Map.of("username", "@" + username.toUpperCase()))
                .andExpect(jsonPath("$.username").value(username));
        perform(put("/api/profile/username"), ana, Map.of("username", username)).andExpect(status().isBadRequest());
        perform(put("/api/profile/username"), ana, Map.of("username", "1ana")).andExpect(status().isBadRequest());
        perform(post("/api/social/search"), ana, Map.of("query", "@" + username.substring(0, 8)))
                .andExpect(jsonPath("$[0].person.username").value(username));
        perform(post("/api/social/search"), ana, Map.of("query", "___"))
                .andExpect(jsonPath("$.length()").value(0));
        perform(post("/api/social/search"), ana, Map.of("query", "%%%"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void emailOnlyWhenVerifiedAndAllowed() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        Map<String, String> query = Map.of("query", bea.email());
        perform(post("/api/social/search"), ana, query)
                .andExpect(jsonPath("$.length()").value(0));
        User user = users.findByEmail(bea.email()).orElseThrow();
        user.markEmailVerified(Instant.now());
        users.save(user);
        perform(post("/api/social/search"), ana, query)
                .andExpect(jsonPath("$.length()").value(1));
        perform(put("/api/profile/discovery"), bea, Map.of("emailSearchable", false))
                .andExpect(status().isOk());
        perform(post("/api/social/search"), ana, query)
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void phoneOnlyWithOptIn() throws Exception {
        Account ana = newAccount();
        Account bea = newAccount();
        Map<String, String> query = Map.of("query", "21 97777-1234");
        perform(put("/api/profile/discovery"), bea, Map.of("phone", "21977771234", "phoneSearchable", false))
                .andExpect(jsonPath("$.phone").value("+5521977771234"));
        perform(post("/api/social/search"), ana, query)
                .andExpect(jsonPath("$.length()").value(0));
        perform(put("/api/profile/discovery"), bea, Map.of("phone", "21977771234", "phoneSearchable", true));
        perform(post("/api/social/search"), ana, query)
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void searchIsLimited() throws Exception {
        Account ana = newAccount();
        for (int i = 0; i < 20; i++) {
            perform(post("/api/social/search"), ana, Map.of("query", "ninguem")).andExpect(status().isOk());
        }
        perform(post("/api/social/search"), ana, Map.of("query", "ninguem")).andExpect(status().isTooManyRequests());
    }

    private void request(Account from, Account to) throws Exception {
        perform(post("/api/social/requests/" + id(to)), from, null).andExpect(status().isNoContent());
    }

    private UUID id(Account account) {
        return users.findByEmail(account.email()).orElseThrow().getPublicId();
    }

    private static String suffix() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }
}
