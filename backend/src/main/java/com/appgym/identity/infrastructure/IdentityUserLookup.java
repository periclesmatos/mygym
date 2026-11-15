package com.appgym.identity.infrastructure;

import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.security.UserLookup;
import org.springframework.stereotype.Component;

/** Implementa a porta do filtro JWT: o token só vale se o usuário ainda existir. */
@Component
class IdentityUserLookup implements UserLookup {
    private final UserRepository users;

    IdentityUserLookup(UserRepository users) {
        this.users = users;
    }

    @Override
    public boolean exists(Long userId) {
        return users.existsById(userId);
    }
}
