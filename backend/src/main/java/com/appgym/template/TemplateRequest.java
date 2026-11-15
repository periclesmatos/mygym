package com.appgym.template;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record TemplateRequest(
        @NotBlank(message = "Informe o nome do treino.")
        @Size(max = 80, message = "O nome do treino está longo demais.")
        String name,
        @Size(max = 2000, message = "As observações estão longas demais.")
        String notes,
        @NotNull(message = "Informe os exercícios.")
        @Size(min = 1, max = 30, message = "O treino precisa ter de 1 a 30 exercícios.")
        @Valid
        List<ExerciseInput> exercises
) {
}
