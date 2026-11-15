package com.appgym.session;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record SessionResponse(
        Long id, String name, Instant startedAt, Instant finishedAt, List<ExerciseResponse> exercises) {
    public static SessionResponse of(Session session) {
        List<ExerciseResponse> exercises = session.getExercises().stream()
                .sorted(Comparator.comparingInt(SessionExercise::getPosition))
                .map(ExerciseResponse::of)
                .toList();
        return new SessionResponse(
                session.getId(), session.getName(), session.getStartedAt(), session.getFinishedAt(), exercises);
    }

    public record ExerciseResponse(
            Long id,
            String name,
            String targetReps,
            BigDecimal targetLoad,
            int restSeconds,
            Integer targetRir,
            List<SetResponse> sets) {
        static ExerciseResponse of(SessionExercise exercise) {
            List<SetResponse> sets = exercise.getSets().stream()
                    .sorted(Comparator.comparingInt(WorkoutSet::getPosition))
                    .map(SetResponse::of)
                    .toList();
            return new ExerciseResponse(
                    exercise.getId(),
                    exercise.getName(),
                    exercise.getTargetReps(),
                    exercise.getTargetLoad(),
                    exercise.getRestSeconds(),
                    exercise.getTargetRir(),
                    sets);
        }
    }

    public record SetResponse(Long id, int position, Integer reps, BigDecimal load, Integer rir, Instant completedAt) {
        static SetResponse of(WorkoutSet set) {
            return new SetResponse(
                    set.getId(), set.getPosition(), set.getReps(), set.getLoad(), set.getRir(), set.getCompletedAt());
        }
    }
}
