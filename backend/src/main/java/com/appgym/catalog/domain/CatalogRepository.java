package com.appgym.catalog.domain;

import java.util.List;
import java.util.Optional;

/** Porta de persistência do catálogo. */
public interface CatalogRepository {

    /** Exercícios do app e os do usuário, por nome. */
    List<CatalogExercise> visibleTo(Long userId);

    /** Exercício criado por este usuário. */
    Optional<CatalogExercise> findOwned(Long id, Long userId);

    CatalogExercise saveAndFlush(CatalogExercise exercise);

    void delete(CatalogExercise exercise);
}
