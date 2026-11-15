package com.appgym.auth;

import com.appgym.error.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CurrentUser {
    private final UserRepository users;

    public CurrentUser(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public User get() {
        return users.findById(AuthenticatedUser.id())
                .orElseThrow(() -> new ApiException(401, "Não autenticado."));
    }
}
