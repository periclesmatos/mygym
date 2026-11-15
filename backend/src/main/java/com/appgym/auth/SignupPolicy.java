package com.appgym.auth;

import com.appgym.error.ApiException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Cadastro por convite: só e-mails de APP_ALLOWED_EMAILS criam conta. Lista vazia fecha o cadastro. */
@Component
public class SignupPolicy {
    private final Set<String> allowed;

    public SignupPolicy(@Value("${app.signup.allowed-emails:}") String allowedEmails) {
        this.allowed = Arrays.stream(allowedEmails.split(","))
                .map(Emails::normalize)
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    public void assertAllowed(String email) {
        if (!allowed.contains(Emails.normalize(email))) {
            throw new ApiException(403, "Este e-mail não está liberado para cadastro.");
        }
    }
}
