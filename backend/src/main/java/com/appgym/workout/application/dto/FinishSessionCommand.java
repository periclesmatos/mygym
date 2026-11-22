package com.appgym.workout.application.dto;

import java.time.Instant;

/** Encerra em outro horário; sem {@code finishedAt} vale agora, menos no treino retroativo. */
public record FinishSessionCommand(Instant startedAt, Instant finishedAt) {}
