package com.appgym.shared.security;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** Chaves {@code app.jwt} e {@code app.cors} do application.yml. */
@ConfigurationProperties("app")
public record SecurityProperties(
        @DefaultValue Jwt jwt, @DefaultValue Cors cors) {

    public record Jwt(String secret, @DefaultValue("720") long expirationHours) {}

    public record Cors(
            @DefaultValue({"http://localhost:5173", "http://127.0.0.1:5173"})
            List<String> allowedOrigins) {}
}
