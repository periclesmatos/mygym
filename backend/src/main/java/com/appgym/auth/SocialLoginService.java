package com.appgym.auth;

import com.appgym.auth.SocialTokenVerifier.Identity;
import com.appgym.auth.SocialTokenVerifier.Provider;
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

    public SocialLoginService(SocialTokenVerifier verifier, UserRepository users, SignupPolicy signup,
                              PasswordEncoder encoder, JwtService jwt) {
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
    public LoginResponse login(Provider provider, String token, String name) {
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
        if ((user.getName() == null || user.getName().isBlank()) && name != null && !name.isBlank()) {
            user.setName(name.trim().length() > 80 ? name.trim().substring(0, 80) : name.trim());
        }
        user = users.save(user);
        return new LoginResponse(jwt.generate(user), user.getEmail());
    }
}
