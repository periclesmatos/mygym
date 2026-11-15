package com.appgym.auth.service;

import com.appgym.auth.service.SocialTokenVerifier.Identity;
import com.appgym.auth.service.SocialTokenVerifier.Provider;
import com.appgym.shared.security.JwtService;
import com.appgym.shared.security.TokenResponse;
import com.appgym.shared.util.Values;
import com.appgym.user.domain.User;
import com.appgym.user.domain.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialLoginService {
    private final SocialTokenVerifier verifier;
    private final UserRepository users;
    private final SignupPolicy signup;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public SocialLoginService(
            SocialTokenVerifier verifier,
            UserRepository users,
            SignupPolicy signup,
            PasswordEncoder encoder,
            JwtService jwt) {
        this.verifier = verifier;
        this.users = users;
        this.signup = signup;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    /**
     * 1) conta já vinculada ao provedor; 2) conta com o mesmo e-mail verificado, que passa a ficar
     * vinculada; 3) conta nova, se o e-mail estiver liberado para cadastro.
     */
    @Transactional
    public TokenResponse login(Provider provider, String token, String name) {
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
        return jwt.issue(users.save(user));
    }
}
