package com.appgym.exercise;

import com.appgym.session.SessionExercise;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExerciseHistoryRepository extends JpaRepository<SessionExercise, Long> {

    @Query("""
            select e from SessionExercise e
            join fetch e.session s
            where s.user.id = :userId
              and s.finishedAt is not null
              and lower(trim(e.name)) in :names
            order by s.finishedAt desc
            """)
    List<SessionExercise> findFinishedByNames(Long userId, List<String> names);

    @Query("""
            select distinct trim(e.name) from SessionExercise e
            where e.session.user.id = :userId
            """)
    List<String> sessionNames(Long userId);

    @Query("""
            select distinct trim(e.name) from com.appgym.template.TemplateExercise e
            where e.template.user.id = :userId
            """)
    List<String> templateNames(Long userId);
}
