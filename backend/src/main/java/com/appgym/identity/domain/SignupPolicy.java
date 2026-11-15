package com.appgym.identity.domain;

import com.appgym.shared.error.ForbiddenException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/** Cadastro por convite: só e-mails da lista criam conta. Lista vazia fecha o cadastro. */
public class SignupPolicy {
    private final Set<String> allowed;

    private SignupPolicy(Set<String> allowed) {
        this.allowed = allowed;
    }

    /** {@code allowedEmails}: e-mails separados por vírgula (APP_ALLOWED_EMAILS). */
    public static SignupPolicy of(String allowedEmails) {
        Set<String> allowed = Arrays.stream(allowedEmails == null ? new String[0] : allowedEmails.split(","))
                .map(Emails::normalize)
                .filter(email -> !email.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        return new SignupPolicy(allowed);
    }

    public void assertAllowed(String email) {
        if (!allowed.contains(Emails.normalize(email))) {
            throw new ForbiddenException("Este e-mail não está liberado para cadastro.");
        }
    }
}
