/**
 * Catálogo de exercícios: os do app e os criados por cada usuário, com grupo muscular,
 * equipamento e sugestões de séries.
 *
 * <p>API pública: {@link com.appgym.catalog.MuscleGroups}, o vocabulário de grupos musculares
 * e equipamentos que os outros módulos validam.
 */
@ApplicationModule(displayName = "Catalog", allowedDependencies = "shared")
package com.appgym.catalog;

import org.springframework.modulith.ApplicationModule;
