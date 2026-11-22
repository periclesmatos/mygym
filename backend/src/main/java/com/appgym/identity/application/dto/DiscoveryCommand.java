package com.appgym.identity.application.dto;

import jakarta.validation.constraints.Size;

/** Como a pessoa pode ser achada. Telefone vazio apaga o número. */
public record DiscoveryCommand(
        @Size(max = 30, message = "Telefone inválido.") String phone,

        boolean phoneSearchable,
        boolean emailSearchable) {}
