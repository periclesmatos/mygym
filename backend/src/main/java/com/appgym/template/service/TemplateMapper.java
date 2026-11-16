package com.appgym.template.service;

import com.appgym.exercise.domain.MuscleGroups;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.util.Values;
import com.appgym.template.api.dto.ExerciseInput;
import com.appgym.template.api.dto.TemplateResponse;
import com.appgym.template.api.dto.TemplateResponse.ExerciseResponse;
import com.appgym.template.domain.Template;
import com.appgym.template.domain.TemplateExercise;
import java.util.Comparator;

final class TemplateMapper {
    private TemplateMapper() {}

    static TemplateResponse toResponse(Template template) {
        return new TemplateResponse(
                template.getId(),
                template.getName(),
                template.getNotes(),
                template.getPosition() == null ? 0 : template.getPosition(),
                template.getExercises().stream()
                        .sorted(Comparator.comparingInt(TemplateExercise::getPosition))
                        .map(TemplateMapper::toResponse)
                        .toList());
    }

    static TemplateExercise toEntity(ExerciseInput input) {
        TemplateExercise exercise = new TemplateExercise();
        exercise.setName(input.name().trim());
        exercise.setPlannedSets(input.plannedSets());
        exercise.setReps(input.reps().trim());
        exercise.setLoad(Values.scale2(input.load()));
        exercise.setRestSeconds(input.restSeconds());
        exercise.setRir(input.rir());
        exercise.setMuscleGroup(muscleGroup(input.muscleGroup()));
        return exercise;
    }

    private static ExerciseResponse toResponse(TemplateExercise exercise) {
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getPosition(),
                exercise.getName(),
                exercise.getPlannedSets(),
                exercise.getReps(),
                exercise.getLoad(),
                exercise.getRestSeconds(),
                exercise.getRir(),
                exercise.getMuscleGroup());
    }

    private static String muscleGroup(String value) {
        if (Values.blankToNull(value) == null) return null;
        return MuscleGroups.group(value).orElseThrow(() -> new BadRequestException("Grupo muscular inválido."));
    }
}
