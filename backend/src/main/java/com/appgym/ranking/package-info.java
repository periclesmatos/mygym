/**
 * Rank pela constância dos últimos 90 dias e troféus.
 *
 * <p>Não tem tabelas nem tarefa agendada: calcula na leitura, pelo histórico que vem de {@link
 * com.appgym.workout.WorkoutApi}. Os números da regra ficam em {@code ScoringRules}.
 */
@ApplicationModule(
        displayName = "Ranking",
        allowedDependencies = {"workout", "shared"})
package com.appgym.ranking;

import org.springframework.modulith.ApplicationModule;
