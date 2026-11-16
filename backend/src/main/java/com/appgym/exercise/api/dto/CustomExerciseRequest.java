package com.appgym.exercise.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomExerciseRequest(
        @NotBlank(message = "Informe o nome do exercício.")
        @Size(max = 80, message = "O nome do exercício está longo demais.")
        String name,

        @NotBlank(message = "Escolha o grupo muscular.") String muscleGroup,

        String equipment) {}
