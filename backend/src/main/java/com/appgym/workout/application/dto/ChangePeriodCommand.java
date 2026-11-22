package com.appgym.workout.application.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

/** Novo início e fim de um treino concluído. */
public record ChangePeriodCommand(
        @NotNull(message = "Informe quando o treino começou.")
        Instant startedAt,

        @NotNull(message = "Informe quando o treino terminou.")
        Instant finishedAt) {}
