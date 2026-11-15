package com.appgym.auth.api;

import com.appgym.auth.api.dto.AppleLoginRequest;
import com.appgym.auth.api.dto.AuthConfigResponse;
import com.appgym.auth.api.dto.GoogleLoginRequest;
import com.appgym.auth.api.dto.LoginRequest;
import com.appgym.auth.api.dto.LoginResponse;
import com.appgym.auth.api.dto.RegisterRequest;
import com.appgym.auth.service.SignupPolicy;
import com.appgym.auth.service.SocialLoginService;
import com.appgym.auth.service.SocialTokenVerifier.Provider;
import com.appgym.shared.config.AppProperties;
import com.appgym.shared.error.ApiException;
import com.appgym.shared.security.JwtService;
import com.appgym.shared.util.Emails;
import com.appgym.user.domain.User;
import com.appgym.user.domain.UserRepository;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final SignupPolicy signup;
    private final SocialLoginService social;
    private final AuthConfigResponse config;

    public AuthController(
            UserRepository users,
            PasswordEncoder encoder,
            JwtService jwt,
            SignupPolicy signup,
            SocialLoginService social,
            AppProperties properties) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.signup = signup;
        this.social = social;
        this.config = new AuthConfigResponse(
                blankToNull(properties.google().clientId()),
                blankToNull(properties.apple().clientId()),
                blankToNull(properties.apple().redirectUri()));
    }

    @PostMapping("/api/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        User user = users.findByEmail(Emails.normalize(request.email()))
                .orElseThrow(() -> new ApiException(401, "E-mail ou senha inválidos."));
        if (!user.hasPassword() || !encoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(401, "E-mail ou senha inválidos.");
        }
        return new LoginResponse(jwt.generate(user), user.getEmail());
    }

    @PostMapping("/api/auth/register")
    @Transactional
    public LoginResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = Emails.normalize(request.email());
        signup.assertAllowed(email);
        if (users.existsByEmail(email)) {
            throw new ApiException(400, "Já existe uma conta com este e-mail. Entre com ele.");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(request.password()));
        user.setPasswordSet(true);
        if (request.name() != null && !request.name().isBlank())
            user.setName(request.name().trim());
        user = users.save(user);
        return new LoginResponse(jwt.generate(user), user.getEmail());
    }

    @PostMapping("/api/auth/google")
    public LoginResponse google(@RequestBody GoogleLoginRequest request) {
        return social.login(Provider.GOOGLE, request.credential(), null);
    }

    @PostMapping("/api/auth/apple")
    public LoginResponse apple(@RequestBody AppleLoginRequest request) {
        return social.login(Provider.APPLE, request.idToken(), request.name());
    }

    @GetMapping("/api/auth/config")
    public AuthConfigResponse config() {
        return config;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
