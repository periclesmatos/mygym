package com.appgym.session;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

public record SessionSummary(
        Long id,
        String name,
        Long templateId,
        Instant startedAt,
        Instant finishedAt,
        int exerciseCount,
        int completedSets,
        int totalSets,
        BigDecimal volume,
        Long durationSeconds
) {
    public static SessionSummary of(Session session) {
        int completed = 0;
        int total = 0;
        BigDecimal volume = BigDecimal.ZERO;
        for (SessionExercise exercise : session.getExercises()) {
            for (WorkoutSet set : exercise.getSets()) {
                total++;
                if (set.getCompletedAt() == null) continue;
                completed++;
                if (set.getReps() != null && set.getLoad() != null) {
                    volume = volume.add(set.getLoad().multiply(BigDecimal.valueOf(set.getReps())));
                }
            }
        }
        Long templateId = session.getTemplate() == null ? null : session.getTemplate().getId();
        Long duration = session.getFinishedAt() == null ? null
                : Math.max(0, Duration.between(session.getStartedAt(), session.getFinishedAt()).getSeconds());
        return new SessionSummary(
                session.getId(), session.getName(), templateId, session.getStartedAt(), session.getFinishedAt(),
                session.getExercises().size(), completed, total, volume.setScale(2, RoundingMode.HALF_UP), duration);
    }
}
