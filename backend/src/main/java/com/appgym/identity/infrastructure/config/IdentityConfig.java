package com.appgym.identity.infrastructure.config;

import com.appgym.identity.application.dto.AuthConfigView;
import com.appgym.identity.domain.SignupPolicy;
import com.appgym.shared.util.Values;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Monta as peças do módulo que dependem de configuração. */
@Configuration
class IdentityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SignupPolicy signupPolicy(IdentityProperties properties) {
        return SignupPolicy.of(properties.signup().allowedEmails());
    }

    @Bean
    AuthConfigView authConfig(IdentityProperties properties) {
        return new AuthConfigView(
                Values.blankToNull(properties.google().clientId()),
                Values.blankToNull(properties.apple().clientId()),
                Values.blankToNull(properties.apple().redirectUri()));
    }
}
