package com.appgym.workout.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Porta de persistência dos treinos. */
public interface SessionRepository {

    boolean hasOpenSession(Long userId);

    /** Treinos em andamento, do mais recente para o mais antigo. */
    List<Session> listOpen(Long userId);

    /** Treinos concluídos, do mais recente para o mais antigo. */
    List<Session> listFinished(Long userId);

    /** Treino do usuário com os exercícios. */
    Optional<Session> findDetailed(Long id, Long userId);

    /** Exercícios de treinos concluídos com estes nomes (chaves), do mais recente para o mais antigo. */
    List<SessionExercise> findFinishedExercises(Long userId, Collection<String> nameKeys);

    /** Nomes de exercício usados nos treinos do usuário. */
    List<String> exerciseNames(Long userId);

    Session save(Session session);

    /** Grava já, para exercícios e séries novos voltarem com id. */
    Session saveAndFlush(Session session);

    void delete(Session session);
}
