package com.appgym.auth;

public final class SocialRequests {
    private SocialRequests() {}

    public record Google(String credential) {}

    /** A Apple só manda o nome no primeiro login, e só para o front. */
    public record Apple(String idToken, String name) {}

    public record Config(String googleClientId, String appleClientId, String appleRedirectUri) {}
}
