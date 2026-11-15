package com.appgym.profile.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateProfileRequest(
        @Size(max = 80, message = "O nome pode ter até 80 caracteres.")
        String name,

        @DecimalMin(value = "20", message = "Peso deve ficar entre 20 e 400 kg.")
        @DecimalMax(value = "400", message = "Peso deve ficar entre 20 e 400 kg.")
        BigDecimal weightKg,

        @Min(value = 80, message = "Altura deve ficar entre 80 e 250 cm.")
        @Max(value = 250, message = "Altura deve ficar entre 80 e 250 cm.")
        Integer heightCm,

        @Past(message = "A data de nascimento precisa estar no passado.")
        LocalDate birthDate) {}
