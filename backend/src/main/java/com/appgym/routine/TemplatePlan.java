package com.appgym.routine;

import java.math.BigDecimal;
import java.util.List;

/** Cópia de leitura de um treino da rotina, para quem está fora do módulo. */
public record TemplatePlan(Long id, String name, List<PlannedExercise> exercises) {

    public record PlannedExercise(
            String name, int plannedSets, String reps, BigDecimal load, int restSeconds, Integer rir, boolean cardio) {}
}
