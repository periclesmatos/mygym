package com.appgym.ranking.domain;

import com.appgym.ranking.Rank;
import java.time.LocalDate;
import java.util.NavigableMap;

/**
 * Posição num dia. Os pontos são sempre os reais; o rank exibido é o maior dos últimos 7 dias.
 *
 * @param protectedDays dias que o rank exibido ainda segura; 0 se não está em proteção
 */
public record Standing(int points, Rank rank, int protectedDays) {

    public static Standing at(NavigableMap<LocalDate, DayScore> days, LocalDate at) {
        int points = RankWindow.points(days, at);
        Rank current = RankLadder.of(points);
        Rank shown = current;
        int held = 0;
        // Do mais recente ao mais antigo: o primeiro que bate o maior é o que segura por mais tempo.
        for (int back = 1; back < ScoringRules.PROTECTION_DAYS; back++) {
            Rank before = RankLadder.of(RankWindow.points(days, at.minusDays(back)));
            if (before.index() > shown.index()) {
                shown = before;
                held = ScoringRules.PROTECTION_DAYS - back;
            }
        }
        return new Standing(points, shown, held);
    }

    public int pointsToKeep() {
        return Math.max(0, rank.floor() - points);
    }
}
