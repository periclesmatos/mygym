package com.appgym.routine;

import java.util.List;
import java.util.Optional;

/** O que a rotina oferece aos outros módulos. */
public interface RoutineApi {

    /** Treino da rotina deste usuário, com os exercícios na ordem. */
    Optional<TemplatePlan> findTemplate(Long userId, Long templateId);

    /** Nomes de exercício usados nos treinos da rotina, sem espaços nas pontas. */
    List<String> exerciseNames(Long userId);
}
