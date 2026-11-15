package com.appgym.routine.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReorderCommand(
        @NotNull(message = "Informe a ordem dos treinos.") List<Long> ids) {}
