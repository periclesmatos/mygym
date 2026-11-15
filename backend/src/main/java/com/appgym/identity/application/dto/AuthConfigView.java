package com.appgym.identity.application.dto;

/** Client IDs públicos para o front decidir quais botões de login mostrar. */
public record AuthConfigView(String googleClientId, String appleClientId, String appleRedirectUri) {}
