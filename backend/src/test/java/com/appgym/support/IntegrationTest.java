package com.appgym.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base dos testes de integração: app inteiro + Postgres real (Testcontainers), schema pelas
 * migrations do Flyway. O container e o contexto do Spring são compartilhados entre as classes;
 * cada teste cria os próprios usuários para não depender dos outros.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class IntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected UserRepository users;

    @Autowired
    protected PasswordEncoder encoder;

    /** Cria um usuário com senha direto no banco e devolve o token dele. */
    protected Account newAccount() throws Exception {
        String email = "u-" + UUID.randomUUID() + "@teste.local";
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode("senha123"));
        user.setPasswordSet(true);
        users.save(user);
        JsonNode response = body(perform(post("/api/auth/login"), null, Map.of("email", email, "password", "senha123"))
                .andExpect(status().isOk()));
        return new Account(email, response.get("token").asText());
    }

    protected ResultActions perform(@NonNull MockHttpServletRequestBuilder request, Account account, Object body)
            throws Exception {
        if (account != null) request.header("Authorization", "Bearer " + account.token());
        if (body != null)
            request.contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .content(Objects.requireNonNull(json.writeValueAsBytes(body)));
        return mvc.perform(request);
    }

    protected JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    public record Account(String email, String token) {}
}
