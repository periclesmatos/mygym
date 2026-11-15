package com.appgym.session;

import com.appgym.template.ExerciseInput;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SessionRequest(
        Long templateId,

        @Size(max = 80, message = "O nome do treino está longo demais.")
        String name,

        @Valid List<ExerciseInput> exercises) {}
