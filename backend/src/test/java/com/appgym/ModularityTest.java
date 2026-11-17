package com.appgym;

import org.junit.jupiter.api.Test;
import org.springframework.lang.NonNull;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

/**
 * Confere as fronteiras do monólito modular: sem ciclos entre módulos e nenhum módulo usando o
 * que é interno de outro (só a raiz do pacote de cada módulo é pública). Gera também os
 * diagramas dos módulos em target/spring-modulith-docs.
 */
class ModularityTest {
    @NonNull
    static final ApplicationModules MODULES = ApplicationModules.of(AppGymApplication.class);

    @Test
    void modulesRespectTheirBoundaries() {
        MODULES.verify();
    }

    @Test
    void writesModuleDiagrams() {
        new Documenter(MODULES).writeModulesAsPlantUml().writeIndividualModulesAsPlantUml();
    }
}
