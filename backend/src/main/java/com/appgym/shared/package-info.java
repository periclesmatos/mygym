/**
 * Base comum a todos os módulos: erros da API, segurança (JWT), configuração e rotas da SPA.
 *
 * <p>Módulo aberto: os outros módulos podem usar qualquer pacote daqui. Por isso ele não
 * depende de nenhum módulo de negócio; quando precisa de algo deles, declara uma porta
 * (como {@link com.appgym.shared.security.UserLookup}) que o módulo dono implementa.
 */
@ApplicationModule(displayName = "Shared", type = ApplicationModule.Type.OPEN)
package com.appgym.shared;

import org.springframework.modulith.ApplicationModule;
