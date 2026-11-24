package com.appgym.identity.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Chaves {@code app.user}, {@code app.google} e {@code app.apple}. */
@ConfigurationProperties("app")
public record IdentityProperties(
        @DefaultValue InitialUser user,
        @DefaultValue Google google,
        @DefaultValue Apple apple) {

    /** Usuário criado no primeiro boot, com o banco vazio. */
    public record InitialUser(String email, String password) {}

    public record Google(@DefaultValue("") String clientId) {}

    public record Apple(
            @DefaultValue("") String clientId,
            @DefaultValue("") String redirectUri) {}
}
