package com.appgym.shared.error;

/** Requisição inválida (400). */
public class BadRequestException extends ApiException {
    public BadRequestException(String message) {
        super(400, message);
    }
}
