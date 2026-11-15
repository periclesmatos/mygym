package com.appgym.workout;

import java.util.Collection;
import java.util.List;

/** O que o módulo de treino oferece aos outros módulos. Só leitura. */
public interface WorkoutApi {

    /**
     * Exercícios de treinos concluídos deste usuário cujo nome bate com uma das chaves, do
     * treino mais recente para o mais antigo.
     *
     * @param nameKeys nomes em minúsculas e sem espaços nas pontas
     */
    List<CompletedExercise> finishedExercises(Long userId, Collection<String> nameKeys);

    /** Nomes de exercício usados nos treinos, sem espaços nas pontas. */
    List<String> exerciseNames(Long userId);
}
