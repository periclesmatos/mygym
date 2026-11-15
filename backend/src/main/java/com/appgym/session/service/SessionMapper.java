package com.appgym.session.service;

import com.appgym.session.api.dto.SessionResponse;
import com.appgym.session.api.dto.SessionResponse.ExerciseResponse;
import com.appgym.session.api.dto.SessionResponse.SetResponse;
import com.appgym.session.api.dto.SessionSummary;
import com.appgym.session.domain.Session;
import com.appgym.session.domain.SessionExercise;
import com.appgym.session.domain.WorkoutSet;
import java.math.RoundingMode;
import java.util.Comparator;

final class SessionMapper {
    private SessionMapper() {}

    static SessionResponse toResponse(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getExercises().stream()
                        .sorted(Comparator.comparingInt(SessionExercise::getPosition))
                        .map(SessionMapper::toResponse)
                        .toList());
    }

    static SessionSummary toSummary(Session session) {
        return new SessionSummary(
                session.getId(),
                session.getName(),
                session.getTemplate() == null ? null : session.getTemplate().getId(),
                session.getStartedAt(),
                session.getFinishedAt(),
                session.getExercises().size(),
                session.completedSets(),
                session.totalSets(),
                session.volume().setScale(2, RoundingMode.HALF_UP),
                session.durationSeconds());
    }

    private static ExerciseResponse toResponse(SessionExercise exercise) {
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getTargetReps(),
                exercise.getTargetLoad(),
                exercise.getRestSeconds(),
                exercise.getTargetRir(),
                exercise.getSets().stream()
                        .sorted(Comparator.comparingInt(WorkoutSet::getPosition))
                        .map(SessionMapper::toResponse)
                        .toList());
    }

    private static SetResponse toResponse(WorkoutSet set) {
        return new SetResponse(
                set.getId(), set.getPosition(), set.getReps(), set.getLoad(), set.getRir(), set.getCompletedAt());
    }
}
