package com.appgym.workout.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.appgym.shared.error.BadRequestException;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SessionTest {

    @Test
    void plannedExerciseStartsWithTheTargetInEverySet() {
        SessionExercise exercise = SessionExercise.planned("Supino", 3, "8-12", new BigDecimal("40.00"), 90, 2, false);
        assertThat(exercise.getSets()).hasSize(3);
        assertThat(exercise.getSets()).allSatisfy(set -> {
            assertThat(set.getLoad()).isEqualByComparingTo("40");
            assertThat(set.getRir()).isEqualTo(2);
        });
        assertThat(exercise.getSets().get(2).getPosition()).isEqualTo(3);
    }

    @Test
    void nextSetRepeatsThePreviousOneOrTheTarget() {
        SessionExercise empty = SessionExercise.planned("Supino", 0, "8-12", new BigDecimal("40.00"), 90, 2, false);
        assertThat(empty.addNextSet().getLoad()).isEqualByComparingTo("40");

        SessionExercise exercise = SessionExercise.planned("Supino", 1, "8-12", new BigDecimal("40.00"), 90, 2, false);
        exercise.getSets().get(0).setLoad(new BigDecimal("45.00"));
        WorkoutSet next = exercise.addNextSet();
        assertThat(next.getLoad()).isEqualByComparingTo("45");
        assertThat(next.getPosition()).isEqualTo(2);
    }

    @Test
    void totalsCountOnlyCompletedSets() {
        Session session = new Session();
        session.setName("Treino");
        session.setStartedAt(Instant.parse("2026-01-01T10:00:00Z"));
        SessionExercise exercise =
                SessionExercise.planned("Supino", 2, "8-12", new BigDecimal("40.00"), 90, null, false);
        session.addExercise(exercise);
        WorkoutSet first = exercise.getSets().get(0);
        first.setReps(10);
        first.markCompleted(true, Instant.now());
        exercise.getSets().get(1).setReps(8);
        session.setFinishedAt(Instant.parse("2026-01-01T11:00:00Z"));

        assertThat(session.totalSets()).isEqualTo(2);
        assertThat(session.completedSets()).isEqualTo(1);
        assertThat(session.volume()).isEqualByComparingTo("400");
        assertThat(session.durationSeconds()).isEqualTo(3600);
    }

    @Test
    void backdatedStartCannotBeInTheFuture() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Session session = new Session();
        assertThatThrownBy(() -> session.startBackdated(now.plusSeconds(61), now))
                .isInstanceOf(BadRequestException.class);
        assertThat(session.isBackdated()).isFalse();

        session.startBackdated(now.minusSeconds(7200), now);
        assertThat(session.isBackdated()).isTrue();
        assertThat(session.getStartedAt()).isEqualTo(now.minusSeconds(7200));
    }

    @Test
    void periodMustBeOrderedRecentAndUpTo24Hours() {
        Instant now = Instant.parse("2026-01-10T12:00:00Z");
        Instant start = now.minusSeconds(2 * 86400);
        Session session = new Session();
        assertThatThrownBy(() -> session.changePeriod(start, start, now)).hasMessageContaining("depois do início");
        assertThatThrownBy(() -> session.changePeriod(start, start.plusSeconds(86401), now))
                .hasMessageContaining("24 horas");
        assertThatThrownBy(() -> session.changePeriod(now, now.plusSeconds(61), now))
                .hasMessageContaining("futuro");
        Instant ancient = Instant.parse("1999-12-31T23:00:00Z");
        assertThatThrownBy(() -> session.changePeriod(ancient, start, now)).hasMessageContaining("Data inválida");
        assertThat(session.isFinished()).isFalse();

        session.changePeriod(start, start.plusSeconds(86400), now);
        assertThat(session.durationSeconds()).isEqualTo(86400);
        session.changePeriod(now, now.plusSeconds(60), now);
        assertThat(session.durationSeconds()).isEqualTo(60);
    }

    @Test
    void completingKeepsTheFirstTime() {
        WorkoutSet set = new WorkoutSet();
        Instant first = Instant.parse("2026-01-01T10:05:00Z");
        set.markCompleted(true, first);
        set.markCompleted(true, first.plusSeconds(60));
        assertThat(set.getCompletedAt()).isEqualTo(first);
        set.markCompleted(false, first);
        assertThat(set.isCompleted()).isFalse();
    }
}
