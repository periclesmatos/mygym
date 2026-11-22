package com.appgym.shared.error;

/** Tentativas demais em pouco tempo (429). */
public class TooManyRequestsException extends ApiException {
    public TooManyRequestsException(String message) {
        super(429, message);
    }
}
