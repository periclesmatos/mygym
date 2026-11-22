package com.appgym.ranking.application.dto;

import com.appgym.ranking.Rank;

/**
 * O que um treino vale no rank de hoje, comparando com e sem ele.
 *
 * @param promotion rank novo, se este treino fez subir
 */
public record ImpactView(Status status, int points, Rank promotion) {

    public enum Status {
        SCORED,
        LATE,
        SHORT,
        EXPIRED,
        CAPPED
    }
}
