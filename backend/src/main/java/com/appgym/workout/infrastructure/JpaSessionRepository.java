package com.appgym.workout.infrastructure;

import com.appgym.workout.domain.Session;
import com.appgym.workout.domain.SessionExercise;
import com.appgym.workout.domain.SessionRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link SessionRepository}. */
interface JpaSessionRepository extends Repository<Session, Long>, SessionRepository {

    boolean existsByUserIdAndFinishedAtIsNull(Long userId);

    List<Session> findByUserIdAndFinishedAtIsNullOrderByStartedAtDesc(Long userId);

    List<Session> findByUserIdAndFinishedAtIsNotNullOrderByFinishedAtDescIdDesc(Long userId);

    @Override
    default boolean hasOpenSession(Long userId) {
        return existsByUserIdAndFinishedAtIsNull(userId);
    }

    @Override
    default List<Session> listOpen(Long userId) {
        return findByUserIdAndFinishedAtIsNullOrderByStartedAtDesc(userId);
    }

    @Override
    default List<Session> listFinished(Long userId) {
        return findByUserIdAndFinishedAtIsNotNullOrderByFinishedAtDescIdDesc(userId);
    }

    @Override
    @Query("""
            select distinct s from Session s
            left join fetch s.exercises
            where s.id = :id and s.userId = :userId
            """)
    Optional<Session> findDetailed(Long id, Long userId);

    @Override
    @Query("""
            select e from SessionExercise e
            join fetch e.session s
            where s.userId = :userId
              and s.finishedAt is not null
              and lower(trim(e.name)) in :nameKeys
            order by s.finishedAt desc
            """)
    List<SessionExercise> findFinishedExercises(Long userId, Collection<String> nameKeys);

    @Override
    @Query("""
            select distinct trim(e.name) from SessionExercise e
            where e.session.userId = :userId
            """)
    List<String> exerciseNames(Long userId);
}
