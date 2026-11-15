package com.appgym.workout.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class SessionTest {

    @Test
    void plannedExerciseStartsWithTheTargetInEverySet() {
        SessionExercise exercise = SessionExercise.planned("Supino", 3, "8-12", new BigDecimal("40.00"), 90, 2);
        assertThat(exercise.getSets()).hasSize(3);
        assertThat(exercise.getSets()).allSatisfy(set -> {
            assertThat(set.getLoad()).isEqualByComparingTo("40");
            assertThat(set.getRir()).isEqualTo(2);
        });
        assertThat(exercise.getSets().get(2).getPosition()).isEqualTo(3);
    }

    @Test
    void nextSetRepeatsThePreviousOneOrTheTarget() {
        SessionExercise empty = SessionExercise.planned("Supino", 0, "8-12", new BigDecimal("40.00"), 90, 2);
        assertThat(empty.addNextSet().getLoad()).isEqualByComparingTo("40");

        SessionExercise exercise = SessionExercise.planned("Supino", 1, "8-12", new BigDecimal("40.00"), 90, 2);
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
        SessionExercise exercise = SessionExercise.planned("Supino", 2, "8-12", new BigDecimal("40.00"), 90, null);
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
