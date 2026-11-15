package com.appgym.shared.error;

import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> api(ApiException exception) {
        return ResponseEntity.status(exception.getStatus()).body(new ErrorResponse(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .filter(Objects::nonNull)
                .findFirst()
                .orElse("Confira os campos e tente de novo.");
        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> unreadable() {
        return ResponseEntity.badRequest().body(new ErrorResponse("Não foi possível ler os dados enviados."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> unexpected(Exception exception) {
        log.error("Unexpected error", exception);
        return ResponseEntity.internalServerError().body(new ErrorResponse("Algo deu errado."));
    }
}
