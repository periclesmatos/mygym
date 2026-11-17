package com.appgym.progress.domain;

import com.appgym.workout.CompletedExercise;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Cálculos de desempenho de um exercício numa sessão. */
public final class ExerciseStats {
    private static final BigDecimal EPLEY_DIVISOR = BigDecimal.valueOf(30);

    private ExerciseStats() {}

    /** Chave para comparar nomes de exercício sem diferenciar caixa nem espaços nas pontas. */
    public static String key(String name) {
        return name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
    }

    /** 1RM estimado pela fórmula de Epley: carga x (1 + reps / 30). */
    public static BigDecimal epley(BigDecimal load, int reps) {
        return load.multiply(
                BigDecimal.ONE.add(BigDecimal.valueOf(reps).divide(EPLEY_DIVISOR, 6, RoundingMode.HALF_UP)));
    }

    /** Desempenho das séries concluídas com reps; vazio se não houver nenhuma. */
    public static Optional<Performance> performance(CompletedExercise exercise) {
        List<SetDone> sets = exercise.sets().stream()
                .filter(set -> set.completed() && set.reps() != null && set.reps() > 0)
                .sorted(Comparator.comparingInt(set -> set.position()))
                .map(set -> new SetDone(set.position(), set.reps(), set.load()))
                .toList();
        if (sets.isEmpty()) return Optional.empty();

        BigDecimal topLoad = null;
        int topReps = 0;
        BigDecimal volume = BigDecimal.ZERO;
        BigDecimal estimatedMax = null;
        for (SetDone set : sets) {
            BigDecimal load = set.load() == null ? BigDecimal.ZERO : set.load();
            volume = volume.add(load.multiply(BigDecimal.valueOf(set.reps())));
            boolean heavier = topLoad == null || load.compareTo(topLoad) > 0;
            boolean sameLoadMoreReps = topLoad != null && load.compareTo(topLoad) == 0 && set.reps() > topReps;
            if (heavier || sameLoadMoreReps) {
                topLoad = load;
                topReps = set.reps();
            }
            if (load.signum() > 0) {
                BigDecimal estimate = epley(load, set.reps());
                if (estimatedMax == null || estimate.compareTo(estimatedMax) > 0) estimatedMax = estimate;
            }
        }
        return Optional.of(new Performance(
                exercise.sessionId(),
                exercise.sessionName(),
                exercise.finishedAt(),
                sets,
                topLoad,
                topReps,
                volume.setScale(2, RoundingMode.HALF_UP),
                estimatedMax == null ? null : estimatedMax.setScale(1, RoundingMode.HALF_UP)));
    }
}
