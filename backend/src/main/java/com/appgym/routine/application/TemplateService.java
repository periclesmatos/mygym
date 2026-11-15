package com.appgym.routine.application;

import com.appgym.routine.application.dto.SaveTemplateCommand;
import com.appgym.routine.application.dto.TemplateView;
import com.appgym.routine.domain.Template;
import com.appgym.routine.domain.TemplateRepository;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.shared.util.Values;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Casos de uso da rotina: listar, criar, editar, reordenar e excluir treinos. */
@Service
public class TemplateService {
    private final TemplateRepository templates;

    public TemplateService(TemplateRepository templates) {
        this.templates = templates;
    }

    @Transactional(readOnly = true)
    public List<TemplateView> list(Long userId) {
        return ordered(userId).stream().map(TemplateMapper::toView).toList();
    }

    @Transactional(readOnly = true)
    public TemplateView get(Long userId, Long id) {
        return TemplateMapper.toView(load(userId, id));
    }

    @Transactional
    public TemplateView create(Long userId, SaveTemplateCommand command) {
        int next = ordered(userId).stream()
                        .map(Template::getPosition)
                        .filter(Objects::nonNull)
                        .max(Comparator.naturalOrder())
                        .orElse(0)
                + 1;
        Template template = new Template();
        template.setUserId(userId);
        template.setCreatedAt(Instant.now());
        template.setPosition(next);
        apply(template, command);
        return TemplateMapper.toView(templates.saveAndFlush(template));
    }

    @Transactional
    public List<TemplateView> reorder(Long userId, List<Long> ids) {
        List<Template> found = ordered(userId);
        boolean sameTemplates = ids.size() == found.size()
                && found.stream()
                        .map(Template::getId)
                        .collect(Collectors.toSet())
                        .equals(new HashSet<>(ids));
        if (!sameTemplates) throw new BadRequestException("A ordem não corresponde aos treinos.");
        Map<Long, Template> byId = found.stream().collect(Collectors.toMap(Template::getId, Function.identity()));
        int position = 1;
        for (Long id : ids) byId.get(id).setPosition(position++);
        return ids.stream().map(byId::get).map(TemplateMapper::toView).toList();
    }

    @Transactional
    public TemplateView update(Long userId, Long id, SaveTemplateCommand command) {
        Template template = load(userId, id);
        apply(template, command);
        return TemplateMapper.toView(templates.saveAndFlush(template));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        // O banco desfaz o vínculo das sessões (ON DELETE SET NULL); o histórico continua.
        templates.delete(load(userId, id));
    }

    private Template load(Long userId, Long id) {
        return templates.findDetailed(id, userId).orElseThrow(() -> new NotFoundException("Treino não encontrado."));
    }

    private List<Template> ordered(Long userId) {
        return templates.listByUser(userId).stream()
                .sorted(Template.ROUTINE_ORDER)
                .toList();
    }

    private static void apply(Template template, SaveTemplateCommand command) {
        template.setName(command.name().trim());
        template.setNotes(Values.blankToNull(command.notes()));
        template.setUpdatedAt(Instant.now());
        template.replaceExercises(
                command.exercises().stream().map(TemplateMapper::toEntity).toList());
    }
}
