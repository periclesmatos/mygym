package com.appgym.profile.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** {@code currentPassword} só é exigida de quem já tem senha. */
public record ChangePasswordRequest(
        String currentPassword,

        @NotBlank(message = "Informe a nova senha.")
        @Size(min = 6, max = 100, message = "A senha precisa ter de 6 a 100 caracteres.")
        String newPassword) {}
