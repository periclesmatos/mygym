package com.appgym.ranking;

import java.util.Collection;
import java.util.Map;

/** O que o rank oferece aos outros módulos. Só leitura. */
public interface RankingApi {

    /** Pontos e rank de hoje de cada usuário, numa consulta só. */
    Map<Long, RankSummary> summaries(Collection<Long> userIds);

    /** Rank, recorde, troféus e resumo do mês, sem cargas. */
    RankProfile profile(Long userId);
}
