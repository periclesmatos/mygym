package com.appgym.identity.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Chaves {@code app.user}, {@code app.signup}, {@code app.google} e {@code app.apple}. */
@ConfigurationProperties("app")
public record IdentityProperties(
        @DefaultValue InitialUser user,
        @DefaultValue Signup signup,
        @DefaultValue Google google,
        @DefaultValue Apple apple) {

    /** Usuário criado no primeiro boot, com o banco vazio. */
    public record InitialUser(String email, String password) {}

    /** {@code allowedEmails}: lista separada por vírgula; vazia fecha o cadastro. */
    public record Signup(@DefaultValue("") String allowedEmails) {}

    public record Google(@DefaultValue("") String clientId) {}

    public record Apple(
            @DefaultValue("") String clientId,
            @DefaultValue("") String redirectUri) {}
}
