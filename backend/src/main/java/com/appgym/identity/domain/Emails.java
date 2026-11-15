package com.appgym.identity.domain;

import java.util.Locale;

/** E-mails são comparados e guardados sem espaços nas pontas e em minúsculas. */
public final class Emails {
    private Emails() {}

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
