package com.appgym.identity.infrastructure;

import com.appgym.identity.domain.Emails;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.identity.infrastructure.config.IdentityProperties;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Cria o primeiro usuário (APP_USER_EMAIL / APP_USER_PASSWORD) quando o banco está vazio. */
@Component
class InitialUserSeeder implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    InitialUserSeeder(UserRepository users, PasswordEncoder encoder, IdentityProperties properties) {
        this.users = users;
        this.encoder = encoder;
        this.email = properties.user().email();
        this.password = properties.user().password();
    }

    @Override
    public void run(ApplicationArguments args) {
        // Só no banco vazio: depois disso o e-mail pode ser trocado pelo perfil.
        if (users.count() > 0) return;
        User user = new User();
        user.setEmail(Emails.normalize(email));
        user.setPasswordHash(encoder.encode(password));
        user.setPasswordSet(true);
        users.save(user);
    }
}
