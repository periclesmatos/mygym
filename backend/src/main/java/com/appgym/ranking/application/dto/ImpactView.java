package com.appgym.ranking.application.dto;

import com.appgym.ranking.Rank;
import com.appgym.ranking.domain.Trophy;
import java.util.List;

/**
 * O que um treino vale no rank de hoje, comparando com e sem ele.
 *
 * @param trophies os que este treino destravou
 * @param promotion rank novo, se este treino fez subir
 */
public record ImpactView(Status status, int points, Rank promotion, List<Trophy> trophies) {

    public enum Status {
        SCORED,
        LATE,
        SHORT,
        EXPIRED,
        CAPPED
    }
}
