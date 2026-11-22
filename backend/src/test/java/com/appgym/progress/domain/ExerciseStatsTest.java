package com.appgym.progress.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.appgym.workout.CompletedExercise;
import com.appgym.workout.CompletedExercise.SetRecord;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class ExerciseStatsTest {

    /** Cada série: {carga, reps, concluída}. */
    static CompletedExercise exercise(Object[]... sets) {
        List<SetRecord> records = new ArrayList<>();
        for (Object[] values : sets) {
            records.add(new SetRecord(
                    records.size() + 1,
                    (Integer) values[1],
                    values[0] == null ? null : new BigDecimal(values[0].toString()),
                    null,
                    null,
                    (Boolean) values[2]));
        }
        return new CompletedExercise(1L, "Treino", Instant.parse("2026-01-01T11:00:00Z"), "Supino", false, records);
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
        assertThat(performance.date()).isEqualTo(Instant.parse("2026-01-01T11:00:00Z"));
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
}
