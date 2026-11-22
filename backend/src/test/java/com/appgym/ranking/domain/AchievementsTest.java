package com.appgym.ranking.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.appgym.workout.LiftSet;
import com.appgym.workout.SessionActivity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class AchievementsTest {
    static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    static final LocalDate MONDAY = LocalDate.parse("2026-11-02");

    final List<SessionActivity> sessions = new ArrayList<>();
    final List<LiftSet> lifts = new ArrayList<>();

    private void train(LocalDate date, int hour, boolean backdated, int meters, int load) {
        long id = sessions.size() + 1L;
        var end = date.atTime(LocalTime.of(hour, 30)).atZone(ZONE).toInstant();
        sessions.add(new SessionActivity(
                id, 1L, "Treino", end, end, backdated, 20, new BigDecimal(4000), 0, 900, 0, meters));
        lifts.add(new LiftSet(id, "supino", BigDecimal.valueOf(load), 8));
    }

    private Map<String, Trophy> trophies() {
        TrainingLog log = new TrainingLog(sessions, ZONE, LocalDate.parse("2026-11-22"));
        return Achievements.of(log, lifts).stream().collect(Collectors.toMap(Trophy::key, Function.identity()));
    }

    @Test
    void thereAre36AndAllStartLocked() {
        assertThat(trophies()).hasSize(36);
        assertThat(trophies().values()).noneMatch(Trophy::achieved);
        assertThat(trophies().get("secret-early").name()).isEqualTo("Troféu secreto");
        assertThat(trophies().get("sets-2").description()).isEqualTo("Complete 1.000 séries.");
    }

    @Test
    void unlocksWithTheDateItHappened() {
        for (int week = 0; week < 2; week++) {
            for (int day : new int[] {0, 2, 4}) train(MONDAY.plusDays(week * 7L + day), 12, false, 5000, 40 + week);
        }
        Map<String, Trophy> result = trophies();
        assertThat(result.get("days-1").achievedOn()).isEqualTo(MONDAY);
        assertThat(result.get("sets-1").achievedOn()).isEqualTo(MONDAY.plusDays(9));
        assertThat(result.get("weeks-1").achievedOn()).isEqualTo(MONDAY.plusDays(11));
        assertThat(result.get("volume-1").achievedOn()).isEqualTo(MONDAY.plusDays(4));
        assertThat(result.get("records-1").achievedOn()).isEqualTo(MONDAY.plusDays(7));
        assertThat(result.get("cardio-1").achievedOn()).isEqualTo(MONDAY.plusDays(7));
        assertThat(result.get("distance-1").achieved()).isTrue();
        assertThat(result.get("rank-projeto").achieved()).isTrue();
    }

    @Test
    void weeksInterruptedDoNotCount() {
        for (int week : new int[] {0, 2}) {
            for (int day = 0; day < 3; day++) train(MONDAY.plusDays(week * 7L + day), 12, false, 0, 40);
        }
        assertThat(trophies().get("weeks-1").achieved()).isFalse();
    }

    @Test
    void secretsOnlyForLiveWorkouts() {
        train(MONDAY, 5, true, 0, 40);
        assertThat(trophies().get("secret-early").achieved()).isFalse();
        train(MONDAY.plusDays(1), 5, false, 0, 40);
        assertThat(trophies().get("secret-early").name()).isEqualTo("Galo Madrugador");
    }
}
