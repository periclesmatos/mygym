package com.appgym.identity.application;

import com.appgym.identity.application.SocialTokenVerifier.Identity;
import com.appgym.identity.application.SocialTokenVerifier.Provider;
import com.appgym.identity.application.dto.AuthToken;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.error.ForbiddenException;
import com.appgym.shared.util.Values;
import java.time.Instant;
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
    private final PasswordEncoder encoder;
    private final TokenIssuer tokens;

    public SocialLoginService(
            SocialTokenVerifier verifier, UserRepository users, PasswordEncoder encoder, TokenIssuer tokens) {
        this.verifier = verifier;
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    /**
     * 1) conta já vinculada ao provedor; 2) conta com o mesmo e-mail, só se ela já provou ser dona
     * dele e ainda não tem outro vínculo com o provedor; 3) conta nova.
     */
    @Transactional
    public AuthToken login(Provider provider, String token, String name) {
        Identity identity = verifier.verify(provider, token);
        Optional<User> linked = provider == Provider.GOOGLE
                ? users.findByGoogleSub(identity.subject())
                : users.findByAppleSub(identity.subject());

        User user = linked.orElseGet(() -> users.findByEmail(identity.email())
                .map(existing -> link(existing, provider, identity))
                .orElseGet(() -> create(provider, identity)));

        // O provedor só confirma o e-mail dele, que pode não ser o da conta.
        if (identity.email().equals(user.getEmail())) user.markEmailVerified(Instant.now());
        String cleanName = Values.blankToNull(name);
        if (user.getName() == null && cleanName != null) {
            user.setName(cleanName.length() > 80 ? cleanName.substring(0, 80) : cleanName);
        }
        return tokens.issue(users.save(user));
    }

    private static User link(User user, Provider provider, Identity identity) {
        // Sem esta prova, quem criou a conta com o e-mail de outra pessoa receberia o login dela.
        if (!user.isEmailVerified()) {
            throw new ForbiddenException(
                    "Já existe uma conta com este e-mail, ainda não confirmado. Entre com e-mail e senha.");
        }
        String current = provider == Provider.GOOGLE ? user.getGoogleSub() : user.getAppleSub();
        if (current != null) {
            throw new ForbiddenException("Esta conta já está vinculada a outro login " + provider.label() + ".");
        }
        setSubject(user, provider, identity.subject());
        return user;
    }

    private User create(Provider provider, Identity identity) {
        User user = new User();
        user.setEmail(identity.email());
        user.setPasswordHash(encoder.encode(UUID.randomUUID().toString()));
        user.setPasswordSet(false);
        setSubject(user, provider, identity.subject());
        return user;
    }

    private static void setSubject(User user, Provider provider, String subject) {
        if (provider == Provider.GOOGLE) user.setGoogleSub(subject);
        else user.setAppleSub(subject);
    }
}
