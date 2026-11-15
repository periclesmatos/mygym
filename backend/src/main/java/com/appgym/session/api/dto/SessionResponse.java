package com.appgym.session.api.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SessionResponse(
        Long id, String name, Instant startedAt, Instant finishedAt, List<ExerciseResponse> exercises) {

    public record ExerciseResponse(
            Long id,
            String name,
            String targetReps,
            BigDecimal targetLoad,
            int restSeconds,
            Integer targetRir,
            List<SetResponse> sets) {}

    public record SetResponse(Long id, int position, Integer reps, BigDecimal load, Integer rir, Instant completedAt) {}
}
