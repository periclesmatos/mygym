package com.appgym.routine.application.dto;

import java.math.BigDecimal;
import java.util.List;

public record TemplateView(Long id, String name, String notes, int position, List<ExerciseView> exercises) {

    public record ExerciseView(
            Long id,
            int position,
            String name,
            int plannedSets,
            String reps,
            BigDecimal load,
            int restSeconds,
            Integer rir,
            String muscleGroup) {}
}
