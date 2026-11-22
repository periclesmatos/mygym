package com.appgym.ranking.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.appgym.workout.SessionActivity;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.NavigableMap;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;
import org.junit.jupiter.api.Test;

class RankRulesTest {
    static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    static final LocalDate TODAY = LocalDate.parse("2026-11-22");

    static SessionActivity activity(Instant end, Instant recorded, long sets, long light, long moderate, long intense) {
        return new SessionActivity(
                1L, 1L, "Treino", end, recorded, false, sets, BigDecimal.ZERO, light, moderate, intense, 0);
    }

    static int day(long sets, long light, long moderate, long intense) {
        Instant now = Instant.parse("2026-11-22T15:00:00Z");
        return DayScore.of(List.of(activity(now, now, sets, light, moderate, intense)))
                .total();
    }

    @Test
    void dayPointsAndCaps() {
        assertThat(day(4, 0, 0, 0)).isZero();
        assertThat(day(5, 0, 0, 0)).isEqualTo(45);
        assertThat(day(18, 0, 0, 0)).isEqualTo(84);
        assertThat(day(40, 0, 0, 0)).isEqualTo(90);
        assertThat(day(0, 599, 0, 0)).isZero();
        assertThat(day(0, 600, 0, 0)).isEqualTo(40);
        assertThat(day(0, 0, 1800, 0)).isEqualTo(75);
        assertThat(day(0, 0, 0, 7200)).isEqualTo(90);
        assertThat(day(15, 0, 1200, 0)).isEqualTo(100);
    }

    @Test
    void roundsCardioOnceAtTheEnd() {
        Instant now = Instant.parse("2026-11-22T15:00:00Z");
        SessionActivity half = activity(now, now, 0, 0, 330, 0);
        assertThat(DayScore.of(List.of(half, half)).cardio()).isEqualTo(16);
    }

    @Test
    void everyStepStartsAtItsFloor() {
        assertThat(RankLadder.STEPS).hasSize(23);
        for (var step : RankLadder.STEPS) {
            assertThat(RankLadder.of(step.floor())).isEqualTo(step);
            if (step.index() > 0) {
                assertThat(RankLadder.of(step.floor() - 1).index()).isEqualTo(step.index() - 1);
            }
        }
        assertThat(RankLadder.of(3310).label()).isEqualTo("Casca Grossa II");
    }

    @Test
    void ninetiethDayCountsAndNinetyFirstDoesNot() {
        NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
        days.put(TODAY.minusDays(90), score(100));
        assertThat(RankWindow.points(days, TODAY)).isZero();
        days.put(TODAY.minusDays(89), score(70));
        assertThat(RankWindow.points(days, TODAY)).isEqualTo(70);
    }

    @Test
    void seventhDayRestsAndBonusDoesNotAccumulate() {
        NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
        LocalDate monday = LocalDate.parse("2026-11-16");
        for (int i = 0; i < 7; i++) days.put(monday.plusDays(i), score(i == 2 ? 45 : 100));
        assertThat(RankWindow.points(days, TODAY)).isEqualTo(680);
        assertThat(RankWindow.weeks(days, TODAY).get(0).resting()).containsExactly(monday.plusDays(2));
    }

    @Test
    void lateLimitAndMovingForward() {
        Instant end = Instant.parse("2026-11-01T12:00:00Z");
        Instant limit = end.plus(ScoringRules.LATE_LIMIT);
        assertThat(TrainingLog.onTime(activity(end, limit, 5, 0, 0, 0))).isTrue();
        assertThat(TrainingLog.onTime(activity(end, limit.plusSeconds(1), 5, 0, 0, 0)))
                .isFalse();
        assertThat(TrainingLog.onTime(activity(end, end.minusSeconds(61), 5, 0, 0, 0)))
                .isFalse();
        assertThat(TrainingLog.onTime(activity(end, null, 5, 0, 0, 0))).isTrue();
    }

    @Test
    void dayTurnsInTheAppZone() {
        Instant lateNight = Instant.parse("2026-11-22T02:30:00Z");
        TrainingLog log = new TrainingLog(List.of(activity(lateNight, lateNight, 10, 0, 0, 0)), ZONE, TODAY);
        assertThat(log.days()).containsOnlyKeys(LocalDate.parse("2026-11-21"));
    }

    @Test
    void extraTrainingNeverLowersPointsAndPointsNeverRiseAlone() {
        Random random = new Random(1);
        for (int round = 0; round < 20_000; round++) {
            NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
            for (int back = 0; back < 120; back++) {
                if (random.nextInt(10) < 6) days.put(TODAY.minusDays(back), score(40 + random.nextInt(61)));
            }
            int before = RankWindow.points(days, TODAY);
            assertThat(RankWindow.points(days, TODAY.plusDays(1))).isLessThanOrEqualTo(before);

            LocalDate extra = TODAY.minusDays(random.nextInt(120));
            int old = days.getOrDefault(extra, DayScore.ZERO).total();
            days.put(extra, score(Math.min(100, Math.max(40, old + random.nextInt(50)))));
            assertThat(RankWindow.points(days, TODAY)).isGreaterThanOrEqualTo(before);
        }
    }

    @Test
    void rhythmsHoldTheirRanks() {
        assertThat(sustained(Set.of(1), 84)).containsExactly("Projeto III");
        assertThat(sustained(Set.of(1, 5), 84)).containsExactly("Maromba I");
        assertThat(sustained(Set.of(1, 3, 5), 84)).containsExactly("Casca Grossa III");
        assertThat(sustained(Set.of(1, 2, 3, 5), 84)).containsExactly("Monstro I");
        assertThat(sustained(Set.of(1, 2, 3, 5, 6), 84)).containsExactly("Mutante");
        assertThat(sustained(Set.of(1, 2, 3, 5, 6), 100)).containsExactly("Lenda");
        assertThat(sustained(Set.of(1, 2, 3, 4, 5, 6), 90)).containsExactly("Lenda");
    }

    @Test
    void dropIsProtectedForSevenDays() {
        NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
        LocalDate first = TODAY.minusDays(89);
        days.put(first, score(100));
        days.put(first.plusDays(10), score(90));
        // Amanhã cai de 190 para 90: segue Frango II por mais 6 dias.
        Standing held = Standing.at(days, TODAY.plusDays(1));
        assertThat(held.points()).isEqualTo(90);
        assertThat(held.rank().label()).isEqualTo("Frango II");
        assertThat(held.protectedDays()).isEqualTo(6);
        assertThat(held.pointsToKeep()).isEqualTo(60);
        assertThat(Standing.at(days, TODAY.plusDays(7)).rank().label()).isEqualTo("Frango I");
    }

    private static DayScore score(int total) {
        return new DayScore(0, 0, 0, total);
    }

    private static Set<String> sustained(Set<Integer> weekdays, int points) {
        NavigableMap<LocalDate, DayScore> days = new TreeMap<>();
        for (int back = 0; back < 300; back++) {
            LocalDate date = TODAY.minusDays(back);
            if (weekdays.contains(date.getDayOfWeek().getValue())) days.put(date, score(points));
        }
        Set<String> seen = new java.util.HashSet<>();
        for (int back = 0; back < 60; back++)
            seen.add(Standing.at(days, TODAY.minusDays(back)).rank().label());
        return seen;
    }
}
