package com.appgym.template;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Numbers {

    private Numbers() {
    }

    public static String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static BigDecimal load(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }
}
