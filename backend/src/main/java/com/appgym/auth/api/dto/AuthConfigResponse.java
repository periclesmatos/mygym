package com.appgym.auth.api.dto;

/** Client IDs públicos para o front decidir quais botões de login mostrar. */
public record AuthConfigResponse(String googleClientId, String appleClientId, String appleRedirectUri) {}
