package com.appgym.ranking.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * A janela móvel. A regra da semana olha só os dias dentro da janela: é o que garante que treino
 * extra nunca tire ponto e que o rank nunca suba sozinho.
 */
public final class RankWindow {
    private RankWindow() {}

    /** Uma semana dentro da janela: os dias que pontuam, os de descanso e o bônus. */
    public record Week(LocalDate start, List<LocalDate> counted, List<LocalDate> resting, int bonus, int points) {}

    public static LocalDate weekStart(LocalDate day) {
        return day.with(DayOfWeek.MONDAY);
    }

    public static List<Week> weeks(NavigableMap<LocalDate, DayScore> days, LocalDate at) {
        Map<LocalDate, List<LocalDate>> byWeek =
                days.subMap(at.minusDays(ScoringRules.WINDOW_DAYS - 1L), true, at, true).entrySet().stream()
                        .filter(entry -> entry.getValue().total() > 0)
                        .map(Map.Entry::getKey)
                        .collect(Collectors.groupingBy(RankWindow::weekStart, TreeMap::new, Collectors.toList()));
        List<Week> weeks = new ArrayList<>();
        byWeek.forEach((start, dates) -> {
            List<LocalDate> best = dates.stream()
                    .sorted(Comparator.comparingInt(
                                    (LocalDate date) -> days.get(date).total())
                            .reversed()
                            .thenComparing(Comparator.naturalOrder()))
                    .toList();
            int kept = Math.min(ScoringRules.DAYS_PER_WEEK, best.size());
            List<LocalDate> counted = best.subList(0, kept);
            int bonus = ScoringRules.weekBonus(dates.size());
            int points = bonus
                    + counted.stream().mapToInt(date -> days.get(date).total()).sum();
            weeks.add(new Week(start, counted, best.subList(kept, best.size()), bonus, points));
        });
        return weeks;
    }

    public static int points(NavigableMap<LocalDate, DayScore> days, LocalDate at) {
        return weeks(days, at).stream().mapToInt(week -> week.points()).sum();
    }
}
