package com.appgym.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Values {
    private Values() {}

    public static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static BigDecimal load(BigDecimal value) {
        if (value == null) return null;
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
