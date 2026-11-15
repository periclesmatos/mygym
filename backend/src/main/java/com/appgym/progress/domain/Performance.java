package com.appgym.progress.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Um exercício feito numa sessão concluída: séries válidas, melhor série, volume e 1RM estimado. */
public record Performance(
        Long sessionId,
        String sessionName,
        Instant date,
        List<SetDone> sets,
        BigDecimal topLoad,
        Integer topReps,
        BigDecimal volume,
        BigDecimal estimatedMax) {}
