package com.appgym.identity.application.dto;

/** Token de acesso do app e o e-mail da conta. */
public record AuthToken(String token, String email) {}
