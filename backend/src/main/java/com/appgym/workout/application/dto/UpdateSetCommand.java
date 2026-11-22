package com.appgym.workout.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
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

        @Min(value = 1, message = "Duração inválida.") @Max(value = 86400, message = "Duração inválida.")
        Integer durationSeconds,

        @Min(value = 0, message = "Distância inválida.") @Max(value = 1000000, message = "Distância inválida.")
        Integer distanceMeters,

        @Pattern(regexp = "light|moderate|intense", message = "Intensidade inválida.")
        String intensity,

        boolean completed) {}
