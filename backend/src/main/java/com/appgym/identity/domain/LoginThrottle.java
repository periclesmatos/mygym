package com.appgym.identity.domain;

import com.appgym.shared.error.TooManyRequestsException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Limita senhas erradas em janelas de 15 minutos. O limite baixo é por e-mail e origem juntos, para
 * ninguém trancar a conta alheia errando a senha dela de propósito. Os limites altos seguram quem
 * varre muitas contas de uma origem ou uma conta de muitas origens.
 *
 * <p>Fica na memória: vale para uma instância e zera quando a API reinicia.
 */
public final class LoginThrottle {
    static final int PER_ACCOUNT_AND_ORIGIN = 10;
    static final int PER_ORIGIN = 50;
    static final int PER_ACCOUNT = 100;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final int MAX_KEYS = 50_000;
    private static final int MAX_EMAIL_LENGTH = 255;

    private final Clock clock;
    private final Map<Key, Window> windows = new LinkedHashMap<>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<Key, Window> eldest) {
            return size() > MAX_KEYS;
        }
    };

    public LoginThrottle(Clock clock) {
        this.clock = clock;
    }

    /** Conta a tentativa antes de conferir a senha, para uma rajada simultânea não passar do limite. */
    public synchronized void attempt(String email, String origin) {
        Instant now = clock.instant();
        List<Limit> limits = limits(email, origin);
        for (Limit limit : limits) {
            Window window = windows.get(limit.key());
            if (window == null) continue;
            if (!now.isBefore(window.endsAt())) windows.remove(limit.key());
            else if (window.count() >= limit.max()) {
                throw new TooManyRequestsException("Muitas tentativas. Espere alguns minutos e tente de novo.");
            }
        }
        for (Limit limit : limits) {
            windows.merge(limit.key(), new Window(1, now.plus(WINDOW)), (current, first) -> current.plusOne());
        }
    }

    /** Senha certa: zera e-mail com origem e devolve a tentativa aos limites largos. */
    public synchronized void succeeded(String email, String origin) {
        String account = shorten(email);
        windows.remove(new Key(account, origin));
        windows.computeIfPresent(new Key(null, origin), (key, window) -> window.minusOne());
        windows.computeIfPresent(new Key(account, null), (key, window) -> window.minusOne());
    }

    private static List<Limit> limits(String email, String origin) {
        String account = shorten(email);
        return List.of(
                new Limit(new Key(account, origin), PER_ACCOUNT_AND_ORIGIN),
                new Limit(new Key(null, origin), PER_ORIGIN),
                new Limit(new Key(account, null), PER_ACCOUNT));
    }

    private static String shorten(String email) {
        return email.length() > MAX_EMAIL_LENGTH ? email.substring(0, MAX_EMAIL_LENGTH) : email;
    }

    /** Campo nulo = qualquer um. */
    private record Key(String email, String origin) {}

    private record Limit(Key key, int max) {}

    private record Window(int count, Instant endsAt) {
        Window plusOne() {
            return new Window(count + 1, endsAt);
        }

        Window minusOne() {
            return count <= 1 ? null : new Window(count - 1, endsAt);
        }
    }
}
