package com.appgym.identity.application;

import com.appgym.identity.application.dto.AuthToken;
import com.appgym.identity.domain.User;
import com.appgym.shared.security.JwtService;
import org.springframework.stereotype.Component;

/** Gera o token de acesso de um usuário. */
@Component
public class TokenIssuer {
    private final JwtService jwt;

    public TokenIssuer(JwtService jwt) {
        this.jwt = jwt;
    }

    public AuthToken issue(User user) {
        return new AuthToken(jwt.issue(user.getId(), user.getEmail()), user.getEmail());
    }
}
