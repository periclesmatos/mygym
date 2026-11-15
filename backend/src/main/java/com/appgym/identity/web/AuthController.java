package com.appgym.identity.web;

import com.appgym.identity.application.AuthService;
import com.appgym.identity.application.SocialLoginService;
import com.appgym.identity.application.SocialTokenVerifier.Provider;
import com.appgym.identity.application.dto.AuthConfigView;
import com.appgym.identity.application.dto.AuthToken;
import com.appgym.identity.application.dto.LoginCommand;
import com.appgym.identity.application.dto.RegisterCommand;
import com.appgym.identity.web.dto.AppleLoginRequest;
import com.appgym.identity.web.dto.GoogleLoginRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final SocialLoginService social;

    public AuthController(AuthService auth, SocialLoginService social) {
        this.auth = auth;
        this.social = social;
    }

    @PostMapping("/login")
    public AuthToken login(@Valid @RequestBody LoginCommand command) {
        return auth.login(command);
    }

    @PostMapping("/register")
    public AuthToken register(@Valid @RequestBody RegisterCommand command) {
        return auth.register(command);
    }

    @PostMapping("/google")
    public AuthToken google(@RequestBody GoogleLoginRequest request) {
        return social.login(Provider.GOOGLE, request.credential(), null);
    }

    @PostMapping("/apple")
    public AuthToken apple(@RequestBody AppleLoginRequest request) {
        return social.login(Provider.APPLE, request.idToken(), request.name());
    }

    @GetMapping("/config")
    public AuthConfigView config() {
        return auth.config();
    }
}
