package com.appgym.exercise.domain;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Grupos musculares e equipamentos aceitos, com a grafia que o app mostra. */
public final class MuscleGroups {
    private MuscleGroups() {}

    public static final List<String> GROUPS = List.of(
            "Peito",
            "Costas",
            "Ombros",
            "Trapézio",
            "Bíceps",
            "Tríceps",
            "Antebraço",
            "Quadríceps",
            "Posterior",
            "Glúteos",
            "Adutores",
            "Panturrilha",
            "Abdômen",
            "Cardio");

    public static final List<String> EQUIPMENT = List.of(
            "Barra", "Halteres", "Máquina", "Polia", "Smith", "Peso corporal", "Kettlebell", "Elástico", "Outro");

    /** Grupo na grafia oficial, aceitando sem acento ou em outra caixa. */
    public static Optional<String> group(String value) {
        return match(GROUPS, value);
    }

    public static Optional<String> equipment(String value) {
        return match(EQUIPMENT, value);
    }

    /** Minúsculo, sem acento e sem espaços nas pontas: para comparar nomes. */
    public static String key(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }

    private static Optional<String> match(List<String> options, String value) {
        String wanted = key(value);
        if (wanted.isEmpty()) return Optional.empty();
        return options.stream().filter(option -> key(option).equals(wanted)).findFirst();
    }
}
