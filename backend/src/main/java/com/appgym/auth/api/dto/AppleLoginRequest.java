package com.appgym.auth.api.dto;

/** A Apple só manda o nome no primeiro login, e só para o front. */
public record AppleLoginRequest(String idToken, String name) {}
