package com.appgym.social.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Vai no corpo para e-mail e telefone não ficarem no log de acesso. */
public record SearchCommand(
        @NotBlank(message = "Digite um username, e-mail ou telefone.")
        @Size(min = 3, max = 255, message = "Digite pelo menos 3 caracteres.")
        String query) {}
