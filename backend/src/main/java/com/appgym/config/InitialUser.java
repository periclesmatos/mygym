package com.appgym.config;

import com.appgym.auth.User;
import com.appgym.auth.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class InitialUser implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public InitialUser(UserRepository users, PasswordEncoder encoder, AppProperties properties) {
        this.users = users;
        this.encoder = encoder;
        this.email = properties.user().email();
        this.password = properties.user().password();
    }

    @Override
    public void run(ApplicationArguments args) {
        // Só no banco vazio: depois disso o e-mail pode ser trocado pelo perfil.
        if (users.count() > 0) return;
        String normalized = email.trim().toLowerCase();
        User user = new User();
        user.setEmail(normalized);
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
    }
}
