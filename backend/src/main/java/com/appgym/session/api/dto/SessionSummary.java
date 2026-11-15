package com.appgym.session.api.dto;

import java.math.BigDecimal;
import java.time.Instant;

/** Treino na lista: totais calculados, sem as séries. */
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
        Long durationSeconds) {}
