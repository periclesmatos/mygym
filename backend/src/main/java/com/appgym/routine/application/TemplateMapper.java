package com.appgym.routine.application;

import com.appgym.catalog.MuscleGroups;
import com.appgym.routine.TemplatePlan;
import com.appgym.routine.TemplatePlan.PlannedExercise;
import com.appgym.routine.application.dto.ExerciseInput;
import com.appgym.routine.application.dto.TemplateView;
import com.appgym.routine.application.dto.TemplateView.ExerciseView;
import com.appgym.routine.domain.Template;
import com.appgym.routine.domain.TemplateExercise;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.util.Values;
import java.util.Comparator;
import java.util.List;

/** Converte entre as entidades da rotina e o que sai do módulo (views e planos). */
final class TemplateMapper {
    private TemplateMapper() {}

    static TemplateView toView(Template template) {
        return new TemplateView(
                template.getId(),
                template.getName(),
                template.getNotes(),
                template.getPosition() == null ? 0 : template.getPosition(),
                sorted(template).stream().map(TemplateMapper::toView).toList());
    }

    static TemplatePlan toPlan(Template template) {
        return new TemplatePlan(
                template.getId(),
                template.getName(),
                sorted(template).stream()
                        .map(exercise -> new PlannedExercise(
                                exercise.getName(),
                                exercise.getPlannedSets(),
                                exercise.getReps(),
                                exercise.getLoad(),
                                exercise.getRestSeconds(),
                                exercise.getRir()))
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

    private static List<TemplateExercise> sorted(Template template) {
        return template.getExercises().stream()
                .sorted(Comparator.comparingInt(exercise -> exercise.getPosition()))
                .toList();
    }

    private static ExerciseView toView(TemplateExercise exercise) {
        return new ExerciseView(
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
