package com.appgym.support;

import java.util.List;
import java.util.Map;

/** Corpos de requisição usados em vários testes. */
public final class Fixtures {
    private Fixtures() {}

    public static Map<String, Object> exercise(String name, int sets, Object load) {
        return load == null
                ? Map.of("name", name, "plannedSets", sets, "reps", "8-12", "restSeconds", 90)
                : Map.of("name", name, "plannedSets", sets, "reps", "8-12", "load", load, "restSeconds", 90);
    }

    public static Map<String, Object> template(String name, Map<?, ?>... exercises) {
        return Map.of("name", name, "exercises", List.of(exercises));
    }
}
