/**
 * Amigos: busca, pedidos, bloqueio e o perfil que um amigo vê.
 *
 * <p>Guarda só ids. Nome e foto vêm de {@link com.appgym.identity.IdentityApi}, rank de {@link
 * com.appgym.ranking.RankingApi}. Para fora sai sempre o id público, nunca o sequencial.
 */
@ApplicationModule(
        displayName = "Social",
        allowedDependencies = {"identity", "ranking", "workout", "shared"})
package com.appgym.social;

import org.springframework.modulith.ApplicationModule;
