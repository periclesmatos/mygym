package com.appgym.shared.error;

/** Sem autenticação válida (401). */
public class UnauthorizedException extends ApiException {
    public static final String NOT_AUTHENTICATED = "Não autenticado.";

    public static UnauthorizedException notAuthenticated() {
        return new UnauthorizedException(NOT_AUTHENTICATED);
    }

    public UnauthorizedException(String message) {
        super(401, message);
    }
}
