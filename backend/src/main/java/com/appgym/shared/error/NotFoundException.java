package com.appgym.shared.error;

/** Recurso inexistente ou de outro usuário (404). */
public class NotFoundException extends ApiException {
    public NotFoundException(String message) {
        super(404, message);
    }
}
