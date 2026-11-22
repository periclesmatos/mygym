package com.appgym.social.domain;

import com.appgym.shared.error.TooManyRequestsException;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

/** Até 20 buscas por minuto por conta, para ninguém varrer usernames e telefones. Fica na memória. */
public final class SearchLimit {
    static final int PER_MINUTE = 20;

    private final Clock clock;
    private final Map<Long, Deque<Instant>> recent = new HashMap<>();

    public SearchLimit(Clock clock) {
        this.clock = clock;
    }

    public synchronized void hit(Long userId) {
        Instant now = clock.instant();
        Deque<Instant> times = recent.computeIfAbsent(userId, key -> new ArrayDeque<>());
        while (!times.isEmpty() && !times.peekFirst().isAfter(now.minusSeconds(60))) times.removeFirst();
        if (times.size() >= PER_MINUTE) throw new TooManyRequestsException("Muitas buscas. Espere um minuto.");
        times.addLast(now);
    }
}
