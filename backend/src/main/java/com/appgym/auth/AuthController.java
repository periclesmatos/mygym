package com.appgym.auth;

import com.appgym.error.ApiException;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/api/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(401, "E-mail ou senha inválidos."));
        if (!encoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(401, "E-mail ou senha inválidos.");
        }
        return new LoginResponse(jwt.generate(user), user.getEmail());
    }
}
