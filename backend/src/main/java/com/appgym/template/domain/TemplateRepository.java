package com.appgym.template.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    @Query("""
            select distinct t from Template t
            left join fetch t.exercises
            where t.user.id = :userId
            """)
    List<Template> listByUser(Long userId);

    @Query("""
            select distinct t from Template t
            left join fetch t.exercises
            where t.id = :id and t.user.id = :userId
            """)
    Optional<Template> findDetailed(Long id, Long userId);
}
