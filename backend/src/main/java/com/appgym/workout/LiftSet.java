package com.appgym.workout;

import java.math.BigDecimal;

/** Uma série de força concluída com carga; {@code nameKey} em minúsculas e sem espaços nas pontas. */
public record LiftSet(Long sessionId, String nameKey, BigDecimal load, int reps) {}
