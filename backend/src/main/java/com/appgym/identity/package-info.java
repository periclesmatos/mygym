/**
 * Contas de usuário: login por senha, cadastro, login com Google e Apple, perfil
 * e foto.
 *
 * <p>Nenhum outro módulo enxerga a entidade {@code User}: eles guardam só o {@code userId}.
 * Para o resto da aplicação, este módulo expõe a implementação de {@link
 * com.appgym.shared.security.UserLookup} e {@link com.appgym.identity.IdentityApi}, que só tem
 * dados públicos.
 */
@ApplicationModule(displayName = "Identity", allowedDependencies = "shared")
package com.appgym.identity;

import org.springframework.modulith.ApplicationModule;
