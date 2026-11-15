package com.appgym.workout.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SessionView(Long id, String name, Instant startedAt, Instant finishedAt, List<ExerciseView> exercises) {

    public record ExerciseView(
            Long id,
            String name,
            String targetReps,
            BigDecimal targetLoad,
            int restSeconds,
            Integer targetRir,
            List<SetView> sets) {}

    public record SetView(Long id, int position, Integer reps, BigDecimal load, Integer rir, Instant completedAt) {}
}
