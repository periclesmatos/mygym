package com.appgym.exercise.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CatalogRepository extends JpaRepository<CatalogExercise, Long> {

    /** Exercícios do app e os do usuário. */
    @Query("""
            select c from CatalogExercise c
            where c.user is null or c.user.id = :userId
            order by c.name
            """)
    List<CatalogExercise> visibleTo(Long userId);

    @Query("select c from CatalogExercise c where c.id = :id and c.user.id = :userId")
    Optional<CatalogExercise> findOwned(Long id, Long userId);
}
