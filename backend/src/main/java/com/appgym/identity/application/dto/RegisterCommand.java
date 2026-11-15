package com.appgym.identity.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterCommand(
        @Size(max = 80, message = "O nome pode ter até 80 caracteres.")
        String name,

        @NotBlank(message = "Informe o e-mail.") @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Informe a senha.")
        @Size(min = 6, max = 100, message = "A senha precisa ter de 6 a 100 caracteres.")
        String password) {}
