package com.appgym.ranking.application.dto;

import com.appgym.ranking.Rank;
import java.time.LocalDate;
import java.util.List;

/** A aba Rank: escada, gráfico, extrato e o que sai nos próximos dias. */
public record DetailsView(
        OverviewView overview,
        List<Rank> ladder,
        List<PointsOnDay> history,
        List<DayEntry> days,
        List<WeekBonus> bonuses,
        List<Expiry> upcoming) {

    public record PointsOnDay(LocalDate date, int points) {}

    public record DayEntry(LocalDate date, int presence, int strength, int cardio, int total, boolean resting) {}

    public record WeekBonus(LocalDate start, int days, int points) {}

    public record Expiry(LocalDate date, int lost, int points) {}
}
