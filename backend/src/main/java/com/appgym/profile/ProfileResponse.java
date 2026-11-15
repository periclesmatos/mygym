package com.appgym.profile;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ProfileResponse(
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
        boolean apple) {}
