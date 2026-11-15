package com.appgym.shared.security;

/** Porta: confirma que o usuário do token ainda existe. Implementada pelo módulo identity. */
public interface UserLookup {
    boolean exists(Long userId);
}
