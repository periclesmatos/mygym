package com.appgym.routine.infrastructure;

import com.appgym.routine.domain.Template;
import com.appgym.routine.domain.TemplateRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link TemplateRepository}. */
interface JpaTemplateRepository extends Repository<Template, Long>, TemplateRepository {

    @Override
    @Query("""
            select distinct t from Template t
            left join fetch t.exercises
            where t.userId = :userId
            """)
    List<Template> listByUser(Long userId);

    @Override
    @Query("""
            select distinct t from Template t
            left join fetch t.exercises
            where t.id = :id and t.userId = :userId
            """)
    Optional<Template> findDetailed(Long id, Long userId);

    @Override
    @Query("""
            select distinct trim(e.name) from TemplateExercise e
            where e.template.userId = :userId
            """)
    List<String> exerciseNames(Long userId);
}
