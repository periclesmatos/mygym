package com.appgym.routine.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ExerciseInput(
        @NotBlank(message = "Informe o nome do exercício.")
        @Size(max = 80, message = "O nome do exercício está longo demais.")
        String name,

        @NotNull(message = "Informe de 1 a 20 séries.")
        @Min(value = 1, message = "Informe de 1 a 20 séries.")
        @Max(value = 20, message = "Informe de 1 a 20 séries.")
        Integer plannedSets,

        @NotBlank(message = "Informe as reps, como 8-12.") @Size(max = 20, message = "Reps deve ser curto, como 8-12.")
        String reps,

        @DecimalMin(value = "0.0", message = "Carga inválida.")
        @Digits(integer = 4, fraction = 2, message = "Carga inválida.")
        BigDecimal load,

        @NotNull(message = "Informe o descanso em segundos.")
        @Min(value = 0, message = "Descanso inválido.")
        @Max(value = 3600, message = "Descanso inválido.")
        Integer restSeconds,

        @Min(value = 0, message = "RIR deve ficar entre 0 e 10.")
        @Max(value = 10, message = "RIR deve ficar entre 0 e 10.")
        Integer rir,

        /** Opcional; nulo deixa o app deduzir pelo nome. */
        String muscleGroup) {}
