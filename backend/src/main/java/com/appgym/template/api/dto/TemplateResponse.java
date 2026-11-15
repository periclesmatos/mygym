package com.appgym.template.api.dto;

import com.appgym.template.domain.Template;
import com.appgym.template.domain.TemplateExercise;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public record TemplateResponse(Long id, String name, String notes, int position, List<ExerciseResponse> exercises) {

    public static TemplateResponse of(Template template) {
        List<ExerciseResponse> exercises = template.getExercises().stream()
                .sorted(Comparator.comparingInt(TemplateExercise::getPosition))
                .map(ExerciseResponse::of)
                .toList();
        int position = template.getPosition() == null ? 0 : template.getPosition();
        return new TemplateResponse(template.getId(), template.getName(), template.getNotes(), position, exercises);
    }

    public record ExerciseResponse(
            Long id,
            int position,
            String name,
            int plannedSets,
            String reps,
            BigDecimal load,
            int restSeconds,
            Integer rir) {
        public static ExerciseResponse of(TemplateExercise exercise) {
            return new ExerciseResponse(
                    exercise.getId(),
                    exercise.getPosition(),
                    exercise.getName(),
                    exercise.getPlannedSets(),
                    exercise.getReps(),
                    exercise.getLoad(),
                    exercise.getRestSeconds(),
                    exercise.getRir());
        }
    }
}
