package com.appgym.template.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record TemplateResponse(Long id, String name, String notes, int position, List<ExerciseResponse> exercises) {

    public record ExerciseResponse(
            Long id,
            int position,
            String name,
            int plannedSets,
            String reps,
            BigDecimal load,
            int restSeconds,
            Integer rir) {}
}
