package com.appgym.catalog.infrastructure;

import com.appgym.catalog.domain.CatalogExercise;
import com.appgym.catalog.domain.CatalogRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link CatalogRepository}. */
interface JpaCatalogRepository extends Repository<CatalogExercise, Long>, CatalogRepository {

    @Override
    @Query("""
            select c from CatalogExercise c
            where c.userId is null or c.userId = :userId
            order by c.name
            """)
    List<CatalogExercise> visibleTo(Long userId);

    @Override
    @Query("select c from CatalogExercise c where c.id = :id and c.userId = :userId")
    Optional<CatalogExercise> findOwned(Long id, Long userId);
}
