package com.appgym.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.appgym.shared.error.TooManyRequestsException;
import java.time.Clock;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class LoginThrottleTest {
    static final Instant START = Instant.parse("2026-11-22T12:00:00Z");

    Clock clock = mock(Clock.class);
    LoginThrottle throttle = new LoginThrottle(clock);

    @BeforeEach
    void setUp() {
        when(clock.instant()).thenReturn(START);
    }

    @Test
    void blocksAccountAndOriginWithoutLockingTheOwnerElsewhere() {
        fail(LoginThrottle.PER_ACCOUNT_AND_ORIGIN, "ana@x.com", "atacante");
        assertBlocked("ana@x.com", "atacante");
        assertThatCode(() -> throttle.attempt("ana@x.com", "casa")).doesNotThrowAnyException();
    }

    @Test
    void blocksOriginSweepingManyAccounts() {
        for (int i = 0; i < LoginThrottle.PER_ORIGIN; i++) throttle.attempt(i + "@x.com", "atacante");
        assertBlocked("outra@x.com", "atacante");
    }

    @Test
    void blocksAccountAttackedFromManyOrigins() {
        for (int i = 0; i < LoginThrottle.PER_ACCOUNT; i++) throttle.attempt("ana@x.com", "origem-" + i);
        assertBlocked("ana@x.com", "nova");
    }

    @Test
    void windowExpires() {
        fail(LoginThrottle.PER_ACCOUNT_AND_ORIGIN, "ana@x.com", "ip");
        when(clock.instant()).thenReturn(START.plus(LoginThrottle.WINDOW).minusMillis(1));
        assertBlocked("ana@x.com", "ip");
        when(clock.instant()).thenReturn(START.plus(LoginThrottle.WINDOW));
        assertThatCode(() -> throttle.attempt("ana@x.com", "ip")).doesNotThrowAnyException();
    }

    @Test
    void correctPasswordsNeverBlock() {
        for (int i = 0; i < LoginThrottle.PER_ACCOUNT * 2; i++) {
            throttle.attempt("ana@x.com", "ip");
            throttle.succeeded("ana@x.com", "ip");
        }
    }

    @Test
    void correctPasswordClearsEarlierMistakes() {
        fail(LoginThrottle.PER_ACCOUNT_AND_ORIGIN - 1, "ana@x.com", "ip");
        throttle.attempt("ana@x.com", "ip");
        throttle.succeeded("ana@x.com", "ip");
        assertThatCode(() -> fail(LoginThrottle.PER_ACCOUNT_AND_ORIGIN, "ana@x.com", "ip"))
                .doesNotThrowAnyException();
    }

    @Test
    void simultaneousBurstDoesNotPassTheLimit() {
        AtomicInteger allowed = new AtomicInteger();
        try (var executor = Executors.newFixedThreadPool(16)) {
            for (int i = 0; i < 200; i++) {
                executor.submit(() -> {
                    throttle.attempt("ana@x.com", "ip");
                    allowed.incrementAndGet();
                });
            }
        }
        assertThat(allowed).hasValue(LoginThrottle.PER_ACCOUNT_AND_ORIGIN);
    }

    private void fail(int times, String email, String origin) {
        for (int i = 0; i < times; i++) throttle.attempt(email, origin);
    }

    private void assertBlocked(String email, String origin) {
        assertThatThrownBy(() -> throttle.attempt(email, origin)).isInstanceOf(TooManyRequestsException.class);
    }
}
