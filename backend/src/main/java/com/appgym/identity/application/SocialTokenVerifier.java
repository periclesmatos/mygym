package com.appgym.identity.application;

/** Porta: valida o ID token de um provedor de login e devolve quem é a pessoa. */
public interface SocialTokenVerifier {

    enum Provider {
        GOOGLE,
        APPLE;

        public String label() {
            return this == GOOGLE ? "Google" : "Apple";
        }
    }

    /** {@code subject}: id da pessoa no provedor; {@code email}: já verificado e normalizado. */
    record Identity(String subject, String email) {}

    Identity verify(Provider provider, String token);
}
