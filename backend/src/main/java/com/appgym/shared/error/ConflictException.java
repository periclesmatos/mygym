package com.appgym.shared.error;

/** Estado atual impede a ação, como treino já encerrado (409). */
public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(409, message);
    }
}
