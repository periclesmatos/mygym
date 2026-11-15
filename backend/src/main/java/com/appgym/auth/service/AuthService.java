package com.appgym.auth.service;

import com.appgym.auth.api.dto.AuthConfigResponse;
import com.appgym.auth.api.dto.LoginRequest;
import com.appgym.auth.api.dto.RegisterRequest;
import com.appgym.shared.config.AppProperties;
import com.appgym.shared.error.ApiException;
import com.appgym.shared.security.JwtService;
import com.appgym.shared.security.TokenResponse;
import com.appgym.shared.util.Emails;
import com.appgym.shared.util.Values;
import com.appgym.user.domain.User;
import com.appgym.user.domain.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final SignupPolicy signup;
    private final AuthConfigResponse config;

    public AuthService(
            UserRepository users,
            PasswordEncoder encoder,
            JwtService jwt,
            SignupPolicy signup,
            AppProperties properties) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.signup = signup;
        this.config = new AuthConfigResponse(
                Values.blankToNull(properties.google().clientId()),
                Values.blankToNull(properties.apple().clientId()),
                Values.blankToNull(properties.apple().redirectUri()));
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = users.findByEmail(Emails.normalize(request.email()))
                .filter(found -> found.hasPassword() && encoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new ApiException(401, "E-mail ou senha inválidos."));
        return jwt.issue(user);
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = Emails.normalize(request.email());
        signup.assertAllowed(email);
        if (users.existsByEmail(email)) {
            throw new ApiException(400, "Já existe uma conta com este e-mail. Entre com ele.");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(request.password()));
        user.setPasswordSet(true);
        user.setName(Values.blankToNull(request.name()));
        return jwt.issue(users.save(user));
    }

    public AuthConfigResponse config() {
        return config;
    }
}
