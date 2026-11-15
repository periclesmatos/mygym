package com.appgym.identity.application;

import com.appgym.identity.application.dto.AuthConfigView;
import com.appgym.identity.application.dto.AuthToken;
import com.appgym.identity.application.dto.LoginCommand;
import com.appgym.identity.application.dto.RegisterCommand;
import com.appgym.identity.domain.Emails;
import com.appgym.identity.domain.SignupPolicy;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.UnauthorizedException;
import com.appgym.shared.util.Values;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Login por senha e cadastro por convite. */
@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenIssuer tokens;
    private final SignupPolicy signup;
    private final AuthConfigView config;

    public AuthService(
            UserRepository users,
            PasswordEncoder encoder,
            TokenIssuer tokens,
            SignupPolicy signup,
            AuthConfigView config) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
        this.signup = signup;
        this.config = config;
    }

    @Transactional(readOnly = true)
    public AuthToken login(LoginCommand command) {
        User user = users.findByEmail(Emails.normalize(command.email()))
                .filter(found -> found.hasPassword() && encoder.matches(command.password(), found.getPasswordHash()))
                .orElseThrow(() -> new UnauthorizedException("E-mail ou senha inválidos."));
        return tokens.issue(user);
    }

    @Transactional
    public AuthToken register(RegisterCommand command) {
        String email = Emails.normalize(command.email());
        signup.assertAllowed(email);
        if (users.existsByEmail(email)) {
            throw new BadRequestException("Já existe uma conta com este e-mail. Entre com ele.");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(command.password()));
        user.setPasswordSet(true);
        user.setName(Values.blankToNull(command.name()));
        return tokens.issue(users.save(user));
    }

    public AuthConfigView config() {
        return config;
    }
}
