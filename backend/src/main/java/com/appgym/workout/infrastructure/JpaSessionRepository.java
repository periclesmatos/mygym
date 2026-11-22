package com.appgym.workout.infrastructure;

import com.appgym.workout.LiftSet;
import com.appgym.workout.SessionActivity;
import com.appgym.workout.domain.Session;
import com.appgym.workout.domain.SessionExercise;
import com.appgym.workout.domain.SessionRepository;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
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

    // Sem join: o Postgres não trava o lado opcional de um outer join.
    @Override
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Session s where s.id = :id and s.userId = :userId")
    Optional<Session> findForUpdate(Long id, Long userId);

    @Override
    @Query("""
            select new com.appgym.workout.SessionActivity(
                s.id, s.userId, s.name, s.finishedAt, s.recordedAt, s.backdated,
                coalesce(sum(case when e.kind = 'strength' and w.reps > 0 then 1 else 0 end), 0),
                sum(case when e.kind = 'strength' then w.load * w.reps end),
                coalesce(sum(case when e.kind = 'cardio' and (w.intensity is null or w.intensity = 'light')
                    then w.durationSeconds else 0 end), 0),
                coalesce(sum(case when e.kind = 'cardio' and w.intensity = 'moderate'
                    then w.durationSeconds else 0 end), 0),
                coalesce(sum(case when e.kind = 'cardio' and w.intensity = 'intense'
                    then w.durationSeconds else 0 end), 0),
                coalesce(max(case when e.kind = 'cardio' then w.distanceMeters else 0 end), 0))
            from Session s
            left join s.exercises e
            left join e.sets w on w.completedAt is not null
            where s.userId in :userIds and s.finishedAt is not null
            group by s.id, s.userId, s.name, s.finishedAt, s.recordedAt, s.backdated
            order by s.finishedAt desc, s.id desc
            """)
    List<SessionActivity> activities(Collection<Long> userIds);

    @Override
    @Query("""
            select new com.appgym.workout.LiftSet(e.session.id, lower(trim(e.name)), w.load, w.reps)
            from SessionExercise e join e.sets w
            where e.session.userId = :userId
              and e.session.finishedAt is not null
              and e.kind = 'strength'
              and w.completedAt is not null and w.reps > 0 and w.load > 0
            """)
    List<LiftSet> lifts(Long userId);

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
