package com.appgym.shared.security;

/** Token de acesso do app e o e-mail da conta. */
public record TokenResponse(String token, String email) {}
