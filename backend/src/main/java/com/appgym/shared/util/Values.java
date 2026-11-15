package com.appgym.shared.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Normalizações simples de valores vindos da API. */
public final class Values {
    private Values() {}

    /** Tira espaços das pontas; texto vazio vira {@code null}. */
    public static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Cargas e medidas sempre com 2 casas. */
    public static BigDecimal scale2(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }
}
