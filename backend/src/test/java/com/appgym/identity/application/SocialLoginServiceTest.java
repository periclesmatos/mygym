package com.appgym.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.appgym.identity.application.SocialTokenVerifier.Identity;
import com.appgym.identity.application.SocialTokenVerifier.Provider;
import com.appgym.identity.domain.SignupPolicy;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import com.appgym.shared.error.ForbiddenException;
import com.appgym.shared.security.JwtService;
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
    SocialLoginService service =
            new SocialLoginService(verifier, users, SignupPolicy.of("nova@x.com"), encoder, new TokenIssuer(jwt));

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
        when(verifier.verify(Provider.APPLE, "tk")).thenReturn(new Identity("a-1", "ana@x.com"));
        when(users.findByAppleSub("a-1")).thenReturn(Optional.empty());
        when(users.findByEmail("ana@x.com")).thenReturn(Optional.of(existing));

        service.login(Provider.APPLE, "tk", "Ana Lima");
        assertThat(existing.getAppleSub()).isEqualTo("a-1");
        assertThat(existing.getName()).isEqualTo("Ana Lima");
        assertThat(existing.hasPassword()).isTrue();
    }

    @Test
    void createsAccountForInvitedEmailWithoutPassword() {
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-2", "nova@x.com"));
        when(users.findByGoogleSub("g-2")).thenReturn(Optional.empty());
        when(users.findByEmail("nova@x.com")).thenReturn(Optional.empty());

        service.login(Provider.GOOGLE, "tk", null);
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(users).save(saved.capture());
        assertThat(saved.getValue().getGoogleSub()).isEqualTo("g-2");
        assertThat(saved.getValue().hasPassword()).isFalse();
    }

    @Test
    void refusesUninvitedNewAccount() {
        when(verifier.verify(Provider.GOOGLE, "tk")).thenReturn(new Identity("g-3", "estranho@x.com"));
        when(users.findByGoogleSub("g-3")).thenReturn(Optional.empty());
        when(users.findByEmail("estranho@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(Provider.GOOGLE, "tk", null)).isInstanceOf(ForbiddenException.class);
    }

    private static User user(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("hash");
        return user;
    }
}
