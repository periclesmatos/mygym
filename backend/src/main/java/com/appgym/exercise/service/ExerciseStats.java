package com.appgym.exercise.service;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.api.dto.SetDone;
import com.appgym.session.domain.Session;
import com.appgym.session.domain.SessionExercise;
import com.appgym.session.domain.WorkoutSet;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Cálculos de desempenho de um exercício numa sessão. */
final class ExerciseStats {
    private static final BigDecimal EPLEY_DIVISOR = BigDecimal.valueOf(30);

    private ExerciseStats() {}

    /** Chave para comparar nomes de exercício sem diferenciar caixa nem espaços nas pontas. */
    static String key(String name) {
        return name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
    }

    /** 1RM estimado pela fórmula de Epley: carga x (1 + reps / 30). */
    static BigDecimal epley(BigDecimal load, int reps) {
        return load.multiply(
                BigDecimal.ONE.add(BigDecimal.valueOf(reps).divide(EPLEY_DIVISOR, 6, RoundingMode.HALF_UP)));
    }

    /** Desempenho das séries concluídas com reps; vazio se não houver nenhuma. */
    static Optional<Performance> performance(SessionExercise exercise) {
        List<SetDone> sets = exercise.getSets().stream()
                .filter(set -> set.isCompleted() && set.getReps() != null && set.getReps() > 0)
                .sorted(Comparator.comparingInt(WorkoutSet::getPosition))
                .map(set -> new SetDone(set.getPosition(), set.getReps(), set.getLoad()))
                .toList();
        if (sets.isEmpty()) return Optional.empty();

        BigDecimal topLoad = null;
        Integer topReps = null;
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
        Session session = exercise.getSession();
        return Optional.of(new Performance(
                session.getId(),
                session.getName(),
                session.getFinishedAt(),
                sets,
                topLoad,
                topReps,
                volume.setScale(2, RoundingMode.HALF_UP),
                estimatedMax == null ? null : estimatedMax.setScale(1, RoundingMode.HALF_UP)));
    }
}
