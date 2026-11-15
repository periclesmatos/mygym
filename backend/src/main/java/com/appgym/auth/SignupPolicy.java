package com.appgym.auth;

import com.appgym.config.AppProperties;
import com.appgym.error.ApiException;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Cadastro por convite: só e-mails de APP_ALLOWED_EMAILS criam conta. Lista vazia fecha o cadastro. */
@Component
public class SignupPolicy {
    private final Set<String> allowed;

    public SignupPolicy(AppProperties properties) {
        this.allowed = properties.signup().allowedSet();
    }

    public void assertAllowed(String email) {
        if (!allowed.contains(Emails.normalize(email))) {
            throw new ApiException(403, "Este e-mail não está liberado para cadastro.");
        }
    }
}
