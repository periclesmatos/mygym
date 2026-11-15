package com.appgym.config;

import com.appgym.auth.User;
import com.appgym.auth.UserRepository;
import org.springframework.beans.factory.annotation.Value;
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

    public InitialUser(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.user.email}") String email,
                       @Value("${app.user.password}") String password) {
        this.users = users;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        String normalized = email.trim().toLowerCase();
        if (users.findByEmail(normalized).isPresent()) return;
        User user = new User();
        user.setEmail(normalized);
        user.setPasswordHash(encoder.encode(password));
        users.save(user);
    }
}
