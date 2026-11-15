package com.appgym.exercise.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.session.domain.Session;
import com.appgym.session.domain.SessionExercise;
import com.appgym.session.domain.WorkoutSet;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ExerciseStatsTest {

    static SessionExercise exercise(Object[]... sets) {
        Session session = new Session();
        session.setName("Treino");
        session.setStartedAt(Instant.parse("2026-01-01T10:00:00Z"));
        session.setFinishedAt(Instant.parse("2026-01-01T11:00:00Z"));
        SessionExercise exercise = new SessionExercise();
        exercise.setName("Supino");
        session.addExercise(exercise);
        for (Object[] values : sets) {
            WorkoutSet set = new WorkoutSet();
            set.setLoad(values[0] == null ? null : new BigDecimal(values[0].toString()));
            set.setReps((Integer) values[1]);
            set.markCompleted((Boolean) values[2], Instant.now());
            exercise.addSet(set);
        }
        return exercise;
    }

    @Test
    void keyIgnoresCaseAndSpaces() {
        assertThat(ExerciseStats.key("  Supino Reto ")).isEqualTo("supino reto");
        assertThat(ExerciseStats.key(null)).isEmpty();
    }

    @Test
    void epleyFormula() {
        assertThat(ExerciseStats.epley(new BigDecimal("100"), 10)).isEqualByComparingTo("133.3333");
    }

    @Test
    void performanceUsesOnlyCompletedSetsWithReps() {
        Performance performance = ExerciseStats.performance(exercise(
                        new Object[] {"40", 10, true},
                        new Object[] {"50", 6, true},
                        new Object[] {"50", 8, true},
                        new Object[] {"80", 5, false},
                        new Object[] {"60", null, true}))
                .orElseThrow();
        assertThat(performance.sets()).hasSize(3);
        assertThat(performance.topLoad()).isEqualByComparingTo("50");
        assertThat(performance.topReps()).isEqualTo(8);
        assertThat(performance.volume()).isEqualByComparingTo("1100.00");
        assertThat(performance.estimatedMax()).isEqualByComparingTo("63.3");
    }

    @Test
    void bodyweightSetsHaveNoEstimatedMax() {
        Performance performance = ExerciseStats.performance(exercise(new Object[] {null, 12, true}))
                .orElseThrow();
        assertThat(performance.topLoad()).isEqualByComparingTo("0");
        assertThat(performance.estimatedMax()).isNull();
    }

    @Test
    void emptyWhenNothingWasDone() {
        assertThat(ExerciseStats.performance(exercise(new Object[] {"40", 10, false})))
                .isEmpty();
    }

    @Test
    void sessionTotalsMatch() {
        Session session = exercise(new Object[] {"40", 10, true}, new Object[] {"40", 8, false})
                .getSession();
        assertThat(session.totalSets()).isEqualTo(2);
        assertThat(session.completedSets()).isEqualTo(1);
        assertThat(session.volume()).isEqualByComparingTo("400");
        assertThat(session.durationSeconds()).isEqualTo(3600);
    }
}
