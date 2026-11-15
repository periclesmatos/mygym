package com.appgym.shared.util;

public final class Emails {
    private Emails() {}

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
