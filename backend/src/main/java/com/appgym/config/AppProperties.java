package com.appgym.config;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Todas as configurações próprias do app (prefixo {@code app} no application.yml). */
@ConfigurationProperties("app")
public record AppProperties(
        @DefaultValue InitialUser user,
        @DefaultValue Signup signup,
        @DefaultValue Google google,
        @DefaultValue Apple apple,
        @DefaultValue Jwt jwt,
        @DefaultValue Cors cors) {

    /** Usuário criado no primeiro boot, com o banco vazio. */
    public record InitialUser(String email, String password) {}

    /** {@code allowedEmails}: lista separada por vírgula; vazia fecha o cadastro. */
    public record Signup(@DefaultValue("") String allowedEmails) {
        public Set<String> allowedSet() {
            return Arrays.stream(allowedEmails.split(","))
                    .map(email -> email.trim().toLowerCase())
                    .filter(email -> !email.isEmpty())
                    .collect(Collectors.toUnmodifiableSet());
        }
    }

    public record Google(@DefaultValue("") String clientId) {}

    public record Apple(
            @DefaultValue("") String clientId,
            @DefaultValue("") String redirectUri) {}

    public record Jwt(String secret, @DefaultValue("720") long expirationHours) {}

    public record Cors(
            @DefaultValue({"http://localhost:5173", "http://127.0.0.1:5173"})
            List<String> allowedOrigins) {}
}
