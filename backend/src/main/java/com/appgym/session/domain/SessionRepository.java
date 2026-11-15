package com.appgym.session.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SessionRepository extends JpaRepository<Session, Long> {

    boolean existsByUser_IdAndFinishedAtIsNull(Long userId);

    List<Session> findByUser_IdAndFinishedAtIsNullOrderByStartedAtDesc(Long userId);

    List<Session> findByUser_IdAndFinishedAtIsNotNullOrderByStartedAtDesc(Long userId);

    @Query("""
            select distinct s from Session s
            left join fetch s.exercises
            where s.id = :id and s.user.id = :userId
            """)
    Optional<Session> findDetailed(Long id, Long userId);
}
