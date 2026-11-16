package com.appgym.workout.application;

import com.appgym.workout.CompletedExercise;
import com.appgym.workout.CompletedExercise.SetRecord;
import com.appgym.workout.application.dto.SessionSummaryView;
import com.appgym.workout.application.dto.SessionView;
import com.appgym.workout.application.dto.SessionView.ExerciseView;
import com.appgym.workout.application.dto.SessionView.SetView;
import com.appgym.workout.domain.Session;
import com.appgym.workout.domain.SessionExercise;
import com.appgym.workout.domain.WorkoutSet;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

/** Converte as entidades do treino no que sai do módulo (views e registros de leitura). */
final class SessionMapper {
    private SessionMapper() {}

    static SessionView toView(Session session) {
        return new SessionView(
                session.getId(),
                session.getName(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getExercises().stream()
                        .sorted(Comparator.comparingInt(exercise -> exercise.getPosition()))
                        .map(SessionMapper::toView)
                        .toList());
    }

    static SessionSummaryView toSummary(Session session) {
        return new SessionSummaryView(
                session.getId(),
                session.getName(),
                session.getTemplateId(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getExercises().size(),
                session.completedSets(),
                session.totalSets(),
                session.volume().setScale(2, RoundingMode.HALF_UP),
                session.durationSeconds());
    }

    static CompletedExercise toCompleted(SessionExercise exercise) {
        Session session = exercise.getSession();
        return new CompletedExercise(
                session.getId(),
                session.getName(),
                session.getFinishedAt(),
                exercise.getName(),
                sortedSets(exercise).stream()
                        .map(set -> new SetRecord(set.getPosition(), set.getReps(), set.getLoad(), set.isCompleted()))
                        .toList());
    }

    private static ExerciseView toView(SessionExercise exercise) {
        return new ExerciseView(
                exercise.getId(),
                exercise.getName(),
                exercise.getTargetReps(),
                exercise.getTargetLoad(),
                exercise.getRestSeconds(),
                exercise.getTargetRir(),
                sortedSets(exercise).stream().map(SessionMapper::toView).toList());
    }

    private static SetView toView(WorkoutSet set) {
        return new SetView(
                set.getId(), set.getPosition(), set.getReps(), set.getLoad(), set.getRir(), set.getCompletedAt());
    }

    private static List<WorkoutSet> sortedSets(SessionExercise exercise) {
        return exercise.getSets().stream()
                .sorted(Comparator.comparingInt(set -> set.getPosition()))
                .toList();
    }
}
