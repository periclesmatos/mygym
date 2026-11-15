package com.appgym.shared.error;

/** Ação não permitida para este usuário (403). */
public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(403, message);
    }
}
