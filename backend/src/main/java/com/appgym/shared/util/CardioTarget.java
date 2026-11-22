package com.appgym.shared.util;

import java.util.regex.Pattern;

/**
 * Quando um exercício se mede em minutos: grupo Cardio <b>e</b> meta em minutos.
 *
 * <p>Só o grupo não basta: rotinas antigas têm "Remo" ou "Subida na escada" 3 × 8-12 com grupo
 * Cardio, deduzido pelo nome, e elas continuam sendo séries e reps.
 */
public final class CardioTarget {
    private static final String GROUP = "Cardio";
    private static final Pattern MINUTES = Pattern.compile("(?i)^[0-9]+(\\s*-\\s*[0-9]+)?\\s*min.*");

    private CardioTarget() {}

    public static boolean inMinutes(String muscleGroup, String target) {
        return muscleGroup != null
                && target != null
                && muscleGroup.trim().equalsIgnoreCase(GROUP)
                && MINUTES.matcher(target.trim()).matches();
    }
}
