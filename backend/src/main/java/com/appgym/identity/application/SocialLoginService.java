package com.appgym.identity.application;

import com.appgym.identity.application.SocialTokenVerifier.Identity;
import com.appgym.identity.application.SocialTokenVerifier.Provider;
import com.appgym.identity.application.dto.AuthToken;
import com.appgym.identity.domain.SignupPolicy;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.util.Values;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Login com Google ou Apple. */
@Service
public class SocialLoginService {
    private final SocialTokenVerifier verifier;
    private final UserRepository users;
    private final SignupPolicy signup;
    private final PasswordEncoder encoder;
    private final TokenIssuer tokens;

    public SocialLoginService(
            SocialTokenVerifier verifier,
            UserRepository users,
            SignupPolicy signup,
            PasswordEncoder encoder,
            TokenIssuer tokens) {
        this.verifier = verifier;
        this.users = users;
        this.signup = signup;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    /**
     * 1) conta já vinculada ao provedor; 2) conta com o mesmo e-mail verificado, que passa a ficar
     * vinculada; 3) conta nova, se o e-mail estiver liberado para cadastro.
     */
    @Transactional
    public AuthToken login(Provider provider, String token, String name) {
        Identity identity = verifier.verify(provider, token);
        Optional<User> linked = provider == Provider.GOOGLE
                ? users.findByGoogleSub(identity.subject())
                : users.findByAppleSub(identity.subject());

        User user = linked.orElseGet(() -> users.findByEmail(identity.email()).orElseGet(() -> {
            signup.assertAllowed(identity.email());
            User created = new User();
            created.setEmail(identity.email());
            created.setPasswordHash(encoder.encode(UUID.randomUUID().toString()));
            created.setPasswordSet(false);
            return created;
        }));

        if (provider == Provider.GOOGLE) user.setGoogleSub(identity.subject());
        else user.setAppleSub(identity.subject());
        String cleanName = Values.blankToNull(name);
        if (user.getName() == null && cleanName != null) {
            user.setName(cleanName.length() > 80 ? cleanName.substring(0, 80) : cleanName);
        }
        return tokens.issue(users.save(user));
    }
}
