package com.appgym.ranking.application.dto;

import com.appgym.ranking.Rank;
import com.appgym.ranking.domain.DayScore;
import java.time.LocalDate;

/** O card do rank. Os campos de situação vêm nulos quando não se aplicam. */
public record OverviewView(
        int points,
        Rank rank,
        Rank next,
        int pointsToNext,
        int workoutsToNext,
        double progress,
        DayScore today,
        NextBonus nextBonus,
        int expiresTomorrow,
        Protection protection,
        Fall fall,
        Peak peak) {

    public record NextBonus(int days, int points) {}

    public record Protection(int days, int pointsToKeep) {}

    public record Fall(Rank rank, int days) {}

    public record Peak(Rank rank, LocalDate date) {}
}
