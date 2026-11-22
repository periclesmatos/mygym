package com.appgym.workout.application;

import com.appgym.workout.CompletedExercise;
import com.appgym.workout.LiftSet;
import com.appgym.workout.SessionActivity;
import com.appgym.workout.WorkoutApi;
import com.appgym.workout.domain.SessionRepository;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementação da API pública do módulo. */
@Service
class WorkoutQueries implements WorkoutApi {
    private final SessionRepository sessions;

    WorkoutQueries(SessionRepository sessions) {
        this.sessions = sessions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompletedExercise> finishedExercises(Long userId, Collection<String> nameKeys) {
        if (nameKeys.isEmpty()) return List.of();
        return sessions.findFinishedExercises(userId, nameKeys).stream()
                .map(SessionMapper::toCompleted)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionActivity> activities(Collection<Long> userIds) {
        return userIds.isEmpty() ? List.of() : sessions.activities(userIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LiftSet> lifts(Long userId) {
        return sessions.lifts(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> exerciseNames(Long userId) {
        return sessions.exerciseNames(userId);
    }
}
