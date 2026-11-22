package com.appgym.ranking.domain;

import java.time.LocalDate;

/**
 * Um troféu com o progresso de uma pessoa.
 *
 * @param tier de 1 (mais fácil) para cima, dentro da categoria
 * @param achievedOn nulo enquanto não conquistou
 * @param secret secreto ainda escondido
 */
public record Trophy(
        String key,
        String category,
        String name,
        String description,
        int tier,
        double current,
        double goal,
        String unit,
        LocalDate achievedOn,
        boolean secret) {

    public boolean achieved() {
        return achievedOn != null;
    }
}
