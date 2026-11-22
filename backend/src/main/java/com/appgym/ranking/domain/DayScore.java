package com.appgym.ranking.domain;

import com.appgym.workout.SessionActivity;
import java.util.List;

/** Pontos de um dia: soma os treinos e só depois aplica os tetos. */
public record DayScore(int presence, int strength, int cardio, int total) {
    public static final DayScore ZERO = new DayScore(0, 0, 0, 0);

    public static DayScore of(List<SessionActivity> sessions) {
        long sets = 0;
        long seconds = 0;
        long halfEffort = 0;
        for (SessionActivity session : sessions) {
            sets += session.strengthSets();
            seconds += session.cardioSeconds();
            // Em metades para o 1,5 do moderado não arredondar antes do fim.
            halfEffort += 2 * session.lightSeconds() + 3 * session.moderateSeconds() + 4 * session.intenseSeconds();
        }
        if (!qualifies(sets, seconds)) return ZERO;
        int strength = (int) Math.min(ScoringRules.STRENGTH_CAP, sets * ScoringRules.PER_SET);
        int cardio = (int) Math.min(ScoringRules.CARDIO_CAP, halfEffort / 120);
        int total = Math.min(ScoringRules.DAY_CAP, ScoringRules.PRESENCE + strength + cardio);
        return new DayScore(ScoringRules.PRESENCE, strength, cardio, total);
    }

    public static boolean qualifies(long sets, long cardioSeconds) {
        return sets >= ScoringRules.MIN_SETS || cardioSeconds >= ScoringRules.MIN_CARDIO_SECONDS;
    }
}
