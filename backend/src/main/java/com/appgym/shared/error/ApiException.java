package com.appgym.shared.error;

/** Erro esperado da API: vira {@code {"message": ...}} com o status HTTP dado. Use as subclasses. */
public abstract class ApiException extends RuntimeException {
    private final int status;

    protected ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    public int getStatus() {
        return status;
    }
}
