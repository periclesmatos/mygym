package com.appgym.identity.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ProfileView(
        String email,
        String name,
        BigDecimal weightKg,
        Integer heightCm,
        LocalDate birthDate,
        Instant createdAt,
        /** data URL (data:image/jpeg;base64,...) ou null. */
        String photo,
        boolean hasPassword,
        boolean google,
        boolean apple,
        String username,
        String phone,
        boolean phoneSearchable,
        boolean emailSearchable,
        boolean emailVerified) {}
