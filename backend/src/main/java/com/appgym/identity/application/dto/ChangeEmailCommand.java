package com.appgym.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ChangeEmailCommand(
        @NotBlank(message = "Informe o novo e-mail.") @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Informe a senha atual.") String currentPassword) {}
