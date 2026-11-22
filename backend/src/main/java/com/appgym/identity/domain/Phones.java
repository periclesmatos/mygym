package com.appgym.identity.domain;

import java.util.Optional;
import java.util.regex.Pattern;

/** Telefones em E.164; sem código de país vale +55. */
public final class Phones {
    private static final Pattern ALLOWED = Pattern.compile("\\+?[0-9 ().-]+");
    private static final Pattern E164 = Pattern.compile("\\+[1-9][0-9]{7,14}");

    private Phones() {}

    public static Optional<String> normalize(String value) {
        if (value == null) return Optional.empty();
        String text = value.trim();
        if (!ALLOWED.matcher(text).matches()) return Optional.empty();
        String digits = text.replaceAll("[^0-9]", "");
        String phone;
        if (text.startsWith("+")) phone = "+" + digits;
        else if (digits.length() == 10 || digits.length() == 11) phone = "+55" + digits;
        else if ((digits.length() == 12 || digits.length() == 13) && digits.startsWith("55")) phone = "+" + digits;
        else return Optional.empty();
        return E164.matcher(phone).matches() ? Optional.of(phone) : Optional.empty();
    }
}
