package com.appgym.profile.api.dto;

import jakarta.validation.constraints.NotBlank;

/** {@code dataUrl}: data:image/jpeg|png|webp;base64,... */
public record PhotoRequest(
        @NotBlank(message = "Envie uma imagem.") String dataUrl) {}
