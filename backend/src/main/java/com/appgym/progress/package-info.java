/**
 * Evolução: a última vez de cada exercício e o histórico com melhor série, volume e 1RM
 * estimado.
 *
 * <p>Não tem tabelas próprias: lê os treinos concluídos por {@link com.appgym.workout.WorkoutApi}
 * e os nomes da rotina por {@link com.appgym.routine.RoutineApi}.
 */
@ApplicationModule(
        displayName = "Progress",
        allowedDependencies = {"workout", "routine", "shared"})
package com.appgym.progress;

import org.springframework.modulith.ApplicationModule;
