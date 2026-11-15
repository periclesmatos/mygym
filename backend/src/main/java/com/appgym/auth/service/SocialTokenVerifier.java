package com.appgym.auth.service;

import com.appgym.shared.config.AppProperties;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.UnauthorizedException;
import com.appgym.shared.util.Emails;
import java.util.Set;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

/**
 * Valida o ID token (JWT) emitido pelo Google ou pela Apple: assinatura pelas chaves públicas
 * do provedor (JWKS), emissor, audiência (o nosso client ID), validade e e-mail verificado.
 */
@Component
public class SocialTokenVerifier {

    public enum Provider {
        GOOGLE,
        APPLE
    }

    public record Identity(String subject, String email) {}

    private static final String GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> GOOGLE_ISSUERS = Set.of("accounts.google.com", "https://accounts.google.com");
    private static final String APPLE_JWKS = "https://appleid.apple.com/auth/keys";
    private static final Set<String> APPLE_ISSUERS = Set.of("https://appleid.apple.com");

    private final JwtDecoder google;
    private final JwtDecoder apple;

    public SocialTokenVerifier(AppProperties properties) {
        this.google = decoder(GOOGLE_JWKS, GOOGLE_ISSUERS, properties.google().clientId());
        this.apple = decoder(APPLE_JWKS, APPLE_ISSUERS, properties.apple().clientId());
    }

    public Identity verify(Provider provider, String token) {
        JwtDecoder decoder = provider == Provider.GOOGLE ? google : apple;
        String label = provider == Provider.GOOGLE ? "Google" : "Apple";
        if (decoder == null) throw new BadRequestException("Login com " + label + " não está configurado.");
        if (token == null || token.isBlank()) throw new BadRequestException("Token do " + label + " ausente.");

        Jwt jwt;
        try {
            jwt = decoder.decode(token);
        } catch (JwtException exception) {
            throw new UnauthorizedException("Não foi possível confirmar o login com " + label + ". Tente de novo.");
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank() || !isTrue(jwt.getClaims().get("email_verified"))) {
            throw new UnauthorizedException("A conta " + label + " não tem um e-mail verificado.");
        }
        return new Identity(jwt.getSubject(), Emails.normalize(email));
    }

    /** O Google manda boolean; a Apple pode mandar a string "true". */
    private static boolean isTrue(Object value) {
        return Boolean.TRUE.equals(value) || "true".equalsIgnoreCase(String.valueOf(value));
    }

    private static JwtDecoder decoder(String jwks, Set<String> issuers, String clientId) {
        if (clientId == null || clientId.isBlank()) return null;
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwks).build();
        OAuth2TokenValidator<Jwt> issuer = jwt -> issuers.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Emissor inválido.", null));
        OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience() != null
                        && jwt.getAudience().contains(clientId)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Audiência inválida.", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(), issuer, audience));
        return decoder;
    }
}
