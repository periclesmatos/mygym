package com.appgym.user;

import com.appgym.shared.config.AppProperties;
import com.appgym.shared.util.Emails;
import com.appgym.user.domain.User;
import com.appgym.user.domain.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class InitialUserSeeder implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public InitialUserSeeder(UserRepository users, PasswordEncoder encoder, AppProperties properties) {
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
