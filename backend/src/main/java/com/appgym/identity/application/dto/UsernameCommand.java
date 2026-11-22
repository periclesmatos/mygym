package com.appgym.identity.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UsernameCommand(
        @NotBlank(message = "Escolha um username.") @Size(max = 30, message = "O username pode ter até 20 caracteres.")
        String username) {}
