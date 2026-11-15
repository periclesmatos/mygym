package com.appgym.workout;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Cópia de leitura de um exercício feito num treino concluído, com todas as séries. */
public record CompletedExercise(
        Long sessionId, String sessionName, Instant finishedAt, String name, List<SetRecord> sets) {

    public record SetRecord(int position, Integer reps, BigDecimal load, boolean completed) {}
}
