package com.appgym.identity.domain;

import com.appgym.shared.error.BadRequestException;
import java.util.Locale;
import java.util.regex.Pattern;

/** O @username: começa com letra, de 3 a 20, só letras sem acento, números e sublinhado. */
public final class Usernames {
    private static final Pattern VALID = Pattern.compile("[a-z][a-z0-9_]{2,19}");

    private Usernames() {}

    public static String parse(String value) {
        String name = normalize(value);
        if (!VALID.matcher(name).matches()) {
            throw new BadRequestException("Use de 3 a 20 letras sem acento, números ou _, começando por letra.");
        }
        return name;
    }

    public static String normalize(String value) {
        if (value == null) return "";
        String name = value.trim().toLowerCase(Locale.ROOT);
        return name.startsWith("@") ? name.substring(1) : name;
    }
}
