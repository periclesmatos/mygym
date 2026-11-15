package com.appgym.profile.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ChangeEmailRequest(
        @NotBlank(message = "Informe o novo e-mail.") @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Informe a senha atual.") String currentPassword) {}
