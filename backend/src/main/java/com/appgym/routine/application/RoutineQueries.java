package com.appgym.routine.application;

import com.appgym.routine.RoutineApi;
import com.appgym.routine.TemplatePlan;
import com.appgym.routine.domain.TemplateRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementação da API pública do módulo. */
@Service
class RoutineQueries implements RoutineApi {
    private final TemplateRepository templates;

    RoutineQueries(TemplateRepository templates) {
        this.templates = templates;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TemplatePlan> findTemplate(Long userId, Long templateId) {
        return templates.findDetailed(templateId, userId).map(TemplateMapper::toPlan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> exerciseNames(Long userId) {
        return templates.exerciseNames(userId);
    }
}
