package com.appgym.workout;

import java.math.BigDecimal;
import java.time.Instant;

/** Totais de um treino concluído, só do que foi marcado como feito. */
public record SessionActivity(
        Long id,
        Long userId,
        String name,
        Instant finishedAt,
        Instant recordedAt,
        boolean backdated,
        long strengthSets,
        BigDecimal volume,
        long lightSeconds,
        long moderateSeconds,
        long intenseSeconds,
        int longestDistanceMeters) {

    public long cardioSeconds() {
        return lightSeconds + moderateSeconds + intenseSeconds;
    }
}
