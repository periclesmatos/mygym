package com.appgym.ranking.domain;

import java.time.Duration;

/** Todos os números do rank, num lugar só para calibrar. Os da escada ficam em {@link RankLadder}. */
public final class ScoringRules {
    private ScoringRules() {}

    public static final int WINDOW_DAYS = 90;

    /** Dia válido: este tanto de séries ou de cardio. */
    public static final int MIN_SETS = 5;

    public static final int MIN_CARDIO_SECONDS = 600;

    public static final int PRESENCE = 30;
    public static final int PER_SET = 3;
    public static final int STRENGTH_CAP = 60;
    public static final int CARDIO_CAP = 60;
    public static final int DAY_CAP = 100;

    /** Na semana contam os melhores dias; o outro é descanso. */
    public static final int DAYS_PER_WEEK = 6;

    /** O rank exibido é o maior destes últimos dias. */
    public static final int PROTECTION_DAYS = 7;

    /** Treino retroativo pontua se registrado até este prazo. */
    public static final Duration LATE_LIMIT = Duration.ofDays(7);

    /** Quanto o fim pode ser corrigido para depois de registrado, sem deixar mover treino velho para hoje. */
    public static final Duration FORWARD_LIMIT = Duration.ofHours(24);

    /** Para estimar "cerca de N treinos" de quem ainda não tem média. */
    public static final int TYPICAL_DAY = 80;

    public static int weekBonus(int days) {
        if (days >= 5) return 80;
        if (days == 4) return 60;
        return days == 3 ? 40 : 0;
    }
}
