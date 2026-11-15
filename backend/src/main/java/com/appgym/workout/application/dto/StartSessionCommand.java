package com.appgym.workout.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Começa pela rotina ({@code templateId}) ou avulso, com nome e exercícios opcionais. */
public record StartSessionCommand(
        Long templateId,

        @Size(max = 80, message = "O nome do treino está longo demais.")
        String name,

        @Valid List<ExerciseInput> exercises) {}
