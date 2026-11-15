package com.appgym.routine.domain;

import java.util.List;
import java.util.Optional;

/** Porta de persistência dos treinos da rotina. */
public interface TemplateRepository {

    /** Treinos do usuário com os exercícios, em qualquer ordem. */
    List<Template> listByUser(Long userId);

    /** Treino do usuário com os exercícios. */
    Optional<Template> findDetailed(Long id, Long userId);

    /** Nomes de exercício usados nos treinos do usuário. */
    List<String> exerciseNames(Long userId);

    /** Grava já, para os exercícios novos voltarem com id. */
    Template saveAndFlush(Template template);

    void delete(Template template);
}
