package com.appgym.shared.security;

import com.appgym.shared.error.ApiException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthenticatedUser {
    private AuthenticatedUser() {}

    public static Long id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long id)) {
            throw new ApiException(401, "Não autenticado.");
        }
        return id;
    }
}
