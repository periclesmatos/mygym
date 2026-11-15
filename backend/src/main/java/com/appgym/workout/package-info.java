/**
 * Treino: a sessão em andamento ou concluída, com exercícios e séries (carga, reps, RIR).
 *
 * <p>Depende de {@link com.appgym.routine.RoutineApi} para começar um treino a partir da
 * rotina. API pública: {@link com.appgym.workout.WorkoutApi}, usada pelo módulo progress.
 */
@ApplicationModule(
        displayName = "Workout",
        allowedDependencies = {"routine", "shared"})
package com.appgym.workout;

import org.springframework.modulith.ApplicationModule;
