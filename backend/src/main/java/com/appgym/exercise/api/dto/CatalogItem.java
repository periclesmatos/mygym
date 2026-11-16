package com.appgym.exercise.api.dto;

import java.util.List;

/** Exercício do catálogo com as sugestões para preencher o treino. */
public record CatalogItem(
        Long id,
        String name,
        List<String> aliases,
        String muscleGroup,
        List<String> secondaryGroups,
        String equipment,
        String kind,
        int plannedSets,
        String reps,
        int restSeconds,
        boolean custom) {}
