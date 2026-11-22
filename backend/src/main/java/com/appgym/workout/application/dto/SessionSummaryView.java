package com.appgym.workout.application.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** Treino na lista: totais calculados, sem as séries. */
public record SessionSummaryView(
        Long id,
        String name,
        Long templateId,
        Instant startedAt,
        Instant finishedAt,
        boolean backdated,
        int exerciseCount,
        int completedSets,
        int totalSets,
        BigDecimal volume,
        Long durationSeconds) {}
