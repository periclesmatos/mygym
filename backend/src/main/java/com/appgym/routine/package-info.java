/**
 * Rotina: os treinos (A, B, C…) com seus exercícios planejados, na ordem em que se revezam.
 *
 * <p>API pública: {@link com.appgym.routine.RoutineApi}, usada pelo módulo workout para
 * começar um treino a partir da rotina e pelo progress para listar os nomes de exercício.
 */
@ApplicationModule(
        displayName = "Routine",
        allowedDependencies = {"catalog", "shared"})
package com.appgym.routine;

import org.springframework.modulith.ApplicationModule;
