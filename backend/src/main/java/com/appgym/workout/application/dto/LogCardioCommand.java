package com.appgym.workout.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Cardio que já terminou, registrado de uma vez. Sem {@code finishedAt} terminou agora. */
public record LogCardioCommand(
        @NotBlank(message = "Escolha a atividade.") @Size(max = 80, message = "O nome da atividade está longo demais.")
        String name,

        @NotNull(message = "Informe quantos minutos durou.")
        @Min(value = 60, message = "O cardio precisa ter pelo menos 1 minuto.")
        @Max(value = 86400, message = "O cardio pode ter até 24 horas.")
        Integer durationSeconds,

        @Min(value = 0, message = "Distância inválida.") @Max(value = 1000000, message = "Distância inválida.")
        Integer distanceMeters,

        @NotNull(message = "Escolha a intensidade.")
        @Pattern(regexp = "light|moderate|intense", message = "Intensidade inválida.")
        String intensity,

        Instant finishedAt,

        @NotBlank(message = "Envio sem identificação.") @Size(max = 40, message = "Envio sem identificação válida.")
        String clientKey) {}
