package com.appgym.auth.api;

import com.appgym.auth.api.dto.AppleLoginRequest;
import com.appgym.auth.api.dto.AuthConfigResponse;
import com.appgym.auth.api.dto.GoogleLoginRequest;
import com.appgym.auth.api.dto.LoginRequest;
import com.appgym.auth.api.dto.RegisterRequest;
import com.appgym.auth.service.AuthService;
import com.appgym.auth.service.SocialLoginService;
import com.appgym.auth.service.SocialTokenVerifier.Provider;
import com.appgym.shared.security.TokenResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    private final AuthService auth;
    private final SocialLoginService social;

    public AuthController(AuthService auth, SocialLoginService social) {
        this.auth = auth;
        this.social = social;
    }

    @PostMapping("/api/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    @PostMapping("/api/auth/register")
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        return auth.register(request);
    }

    @PostMapping("/api/auth/google")
    public TokenResponse google(@RequestBody GoogleLoginRequest request) {
        return social.login(Provider.GOOGLE, request.credential(), null);
    }

    @PostMapping("/api/auth/apple")
    public TokenResponse apple(@RequestBody AppleLoginRequest request) {
        return social.login(Provider.APPLE, request.idToken(), request.name());
    }

    @GetMapping("/api/auth/config")
    public AuthConfigResponse config() {
        return auth.config();
    }
}
