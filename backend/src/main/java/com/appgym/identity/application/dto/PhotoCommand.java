package com.appgym.identity.application.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code dataUrl}: data:image/jpeg|png|webp;base64,... */
public record PhotoCommand(
        @NotBlank(message = "Envie uma imagem.") String dataUrl) {}
