package com.appgym.template;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record OrderRequest(
        @NotNull(message = "Informe a ordem dos treinos.") List<Long> ids) {}
