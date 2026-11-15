package com.appgym.workout.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public record UpdateSetCommand(
        @Min(value = 0, message = "Reps inválidas.") @Max(value = 999, message = "Reps inválidas.")
        Integer reps,

        @DecimalMin(value = "0.0", message = "Carga inválida.")
        @Digits(integer = 4, fraction = 2, message = "Carga inválida.")
        BigDecimal load,

        @Min(value = 0, message = "RIR deve ficar entre 0 e 10.")
        @Max(value = 10, message = "RIR deve ficar entre 0 e 10.")
        Integer rir,

        boolean completed) {}
