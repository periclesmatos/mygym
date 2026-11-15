/**
 * Contas de usuário: login por senha, cadastro por convite, login com Google e Apple, perfil
 * e foto.
 *
 * <p>Nenhum outro módulo enxerga a entidade {@code User}: eles guardam só o {@code userId}.
 * Para o resto da aplicação, este módulo expõe apenas a implementação de
 * {@link com.appgym.shared.security.UserLookup}.
 */
@ApplicationModule(displayName = "Identity", allowedDependencies = "shared")
package com.appgym.identity;

import org.springframework.modulith.ApplicationModule;
