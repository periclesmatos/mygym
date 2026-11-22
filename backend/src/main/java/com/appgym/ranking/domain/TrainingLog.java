package com.appgym.ranking.domain;

import com.appgym.ranking.Rank;
import com.appgym.workout.SessionActivity;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NavigableMap;
import java.util.TreeMap;

/** O histórico de uma pessoa já filtrado pelo que pontua e agrupado por dia no fuso do app. */
public final class TrainingLog {
    private final List<SessionActivity> sessions;
    private final NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
    private final ZoneId zone;
    private final LocalDate today;

    public TrainingLog(List<SessionActivity> all, ZoneId zone, LocalDate today) {
        this.zone = zone;
        this.today = today;
        this.sessions = all.stream()
                .filter(TrainingLog::onTime)
                .filter(session -> !day(session).isAfter(today))
                .sorted(Comparator.comparing(session -> session.finishedAt()))
                .toList();
        TreeMap<LocalDate, List<SessionActivity>> byDay = new TreeMap<>();
        for (SessionActivity session : sessions) {
            byDay.computeIfAbsent(day(session), key -> new ArrayList<>()).add(session);
        }
        byDay.forEach((date, list) -> {
            DayScore score = DayScore.of(list);
            if (score.total() > 0) days.put(date, score);
        });
    }

    /** Registrado em até 7 dias, e não movido mais de um dia para depois disso. */
    public static boolean onTime(SessionActivity session) {
        Instant end = session.finishedAt();
        Instant recorded = session.recordedAt() == null ? end : session.recordedAt();
        return !end.isAfter(recorded.plus(ScoringRules.FORWARD_LIMIT))
                && Duration.between(end, recorded).compareTo(ScoringRules.LATE_LIMIT) <= 0;
    }

    public LocalDate day(SessionActivity session) {
        return session.finishedAt().atZone(zone).toLocalDate();
    }

    public List<SessionActivity> sessions() {
        return sessions;
    }

    public NavigableMap<LocalDate, DayScore> days() {
        return days;
    }

    public LocalDate today() {
        return today;
    }

    public ZoneId zone() {
        return zone;
    }

    public Standing standing() {
        return Standing.at(days, today);
    }

    public record Reached(Rank rank, LocalDate date) {}

    /** Cada degrau na primeira vez em que foi alcançado, em ordem. O último é o recorde. */
    public List<Reached> climb() {
        List<Reached> reached = new ArrayList<>();
        if (days.isEmpty()) return reached;
        int top = -1;
        // Só um dia de treino faz os pontos subirem.
        for (LocalDate date : days.keySet()) {
            Rank rank = RankLadder.of(RankWindow.points(days, date));
            while (top < rank.index()) {
                top++;
                reached.add(new Reached(RankLadder.STEPS.get(top), date));
            }
        }
        return reached;
    }

    /** Dias seguidos com treino válido, até hoje ou ontem. */
    public int streak() {
        LocalDate cursor = days.containsKey(today) ? today : today.minusDays(1);
        int count = 0;
        while (days.containsKey(cursor)) {
            count++;
            cursor = cursor.minusDays(1);
        }
        return count;
    }
}
