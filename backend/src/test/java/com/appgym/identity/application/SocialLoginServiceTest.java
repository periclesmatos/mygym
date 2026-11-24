package com.appgym.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.appgym.identity.application.SocialTokenVerifier.Identity;
import com.appgym.identity.application.SocialTokenVerifier.Provider;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.error.ForbiddenException;
import com.appgym.shared.security.JwtService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

class SocialLoginServiceTest {
    SocialTokenVerifier verifier = mock(SocialTokenVerifier.class);
    UserRepository users = mock(UserRepository.class);
    PasswordEncoder encoder = mock(PasswordEncoder.class);
    JwtService jwt = mock(JwtService.class);
    SocialLoginService service = new SocialLoginService(verifier, users, encoder, new TokenIssuer(jwt));

    @BeforeEach
    void setUp() {
        when(users.save(any())).thenAnswer(call -> call.getArgument(0));
        when(jwt.issue(any(), any())).thenReturn("t");
        when(encoder.encode(any())).thenReturn("hash");
    }

    @Test
    void usesAccountAlreadyLinkedToProvider() {
        User linked = user("ana@x.com");
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-1", "outro@x.com"));
        when(users.findByGoogleSub("g-1")).thenReturn(Optional.of(linked));

        assertThat(service.login(Provider.GOOGLE, "tk", null).email()).isEqualTo("ana@x.com");
    }

    @Test
    void linksExistingAccountWithSameVerifiedEmail() {
        User existing = user("ana@x.com");
        existing.markEmailVerified(Instant.now());
        when(verifier.verify(Provider.APPLE, "tk")).thenReturn(new Identity("a-1", "ana@x.com"));
        when(users.findByAppleSub("a-1")).thenReturn(Optional.empty());
        when(users.findByEmail("ana@x.com")).thenReturn(Optional.of(existing));

        service.login(Provider.APPLE, "tk", "Ana Lima");
        assertThat(existing.getAppleSub()).isEqualTo("a-1");
        assertThat(existing.getName()).isEqualTo("Ana Lima");
        assertThat(existing.hasPassword()).isTrue();
    }

    @Test
    void createsAccountWithoutPassword() {
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-2", "nova@x.com"));
        when(users.findByGoogleSub("g-2")).thenReturn(Optional.empty());
        when(users.findByEmail("nova@x.com")).thenReturn(Optional.empty());

        service.login(Provider.GOOGLE, "tk", null);
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getGoogleSub()).isEqualTo("g-2");
        assertThat(saved.getValue().hasPassword()).isFalse();
        assertThat(saved.getValue().isEmailVerified()).isTrue();
    }

    @Test
    void doesNotHandVictimsLoginToAccountThatClaimedTheirEmail() {
        User attacker = user("vitima@x.com");
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-vitima", "vitima@x.com"));
        when(users.findByGoogleSub("g-vitima")).thenReturn(Optional.empty());
        when(users.findByEmail("vitima@x.com")).thenReturn(Optional.of(attacker));

        assertThatThrownBy(() -> service.login(Provider.GOOGLE, "tk", null)).isInstanceOf(ForbiddenException.class);
        assertThat(attacker.getGoogleSub()).isNull();
        assertThat(attacker.isEmailVerified()).isFalse();
        verify(users, never()).save(any());
    }

    @Test
    void attackerLinkedToOneProviderDoesNotReceiveVictimsOtherProvider() {
        User attacker = user("vitima@x.com");
        attacker.setGoogleSub("g-atacante");
        when(verifier.verify(Provider.APPLE, "tk")).thenReturn(new Identity("a-vitima", "vitima@x.com"));
        when(users.findByAppleSub("a-vitima")).thenReturn(Optional.empty());
        when(users.findByEmail("vitima@x.com")).thenReturn(Optional.of(attacker));

        assertThatThrownBy(() -> service.login(Provider.APPLE, "tk", null)).isInstanceOf(ForbiddenException.class);
        assertThat(attacker.getAppleSub()).isNull();
    }

    @Test
    void doesNotReplaceExistingLinkWithSameProvider() {
        User existing = user("ana@x.com");
        existing.markEmailVerified(Instant.now());
        existing.setGoogleSub("g-antigo");
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-novo", "ana@x.com"));
        when(users.findByGoogleSub("g-novo")).thenReturn(Optional.empty());
        when(users.findByEmail("ana@x.com")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.login(Provider.GOOGLE, "tk", null)).isInstanceOf(ForbiddenException.class);
        assertThat(existing.getGoogleSub()).isEqualTo("g-antigo");
    }

    @Test
    void olderLinkedAccountBecomesVerifiedWhenProviderEmailMatches() {
        User linked = user("ana@x.com");
        linked.setGoogleSub("g-1");
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-1", "ana@x.com"));
        when(users.findByGoogleSub("g-1")).thenReturn(Optional.of(linked));

        service.login(Provider.GOOGLE, "tk", null);
        assertThat(linked.isEmailVerified()).isTrue();
    }

    @Test
    void providerDoesNotVerifyADifferentAccountEmail() {
        User linked = user("trocado@x.com");
        linked.setGoogleSub("g-1");
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-1", "ana@x.com"));
        when(users.findByGoogleSub("g-1")).thenReturn(Optional.of(linked));

        service.login(Provider.GOOGLE, "tk", null);
        assertThat(linked.isEmailVerified()).isFalse();
    }

    private static User user(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hash");
        return user;
    }
}
