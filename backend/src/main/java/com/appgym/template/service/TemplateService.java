package com.appgym.template.service;

import com.appgym.session.domain.SessionRepository;
import com.appgym.shared.error.ApiException;
import com.appgym.shared.util.Values;
import com.appgym.template.api.dto.TemplateRequest;
import com.appgym.template.api.dto.TemplateResponse;
import com.appgym.template.domain.Template;
import com.appgym.template.domain.TemplateRepository;
import com.appgym.user.domain.UserRepository;
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

@Service
public class TemplateService {
    /** Ordem da rotina; treinos ainda sem posição vão para o fim, pela data de criação. */
    private static final Comparator<Template> ROUTINE_ORDER = Comparator.comparing(
                    Template::getPosition, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Template::getCreatedAt)
            .thenComparing(Template::getId);

    private final TemplateRepository templates;
    private final SessionRepository sessions;
    private final UserRepository users;

    public TemplateService(TemplateRepository templates, SessionRepository sessions, UserRepository users) {
        this.templates = templates;
        this.sessions = sessions;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<TemplateResponse> list(Long userId) {
        return ordered(userId).stream().map(TemplateMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse get(Long userId, Long id) {
        return TemplateMapper.toResponse(load(userId, id));
    }

    @Transactional
    public TemplateResponse create(Long userId, TemplateRequest request) {
        int next = ordered(userId).stream()
                        .map(Template::getPosition)
                        .filter(Objects::nonNull)
                        .max(Comparator.naturalOrder())
                        .orElse(0)
                + 1;
        Template template = new Template();
        template.setUser(users.getReferenceById(userId));
        template.setCreatedAt(Instant.now());
        template.setPosition(next);
        apply(template, request);
        return TemplateMapper.toResponse(templates.saveAndFlush(template));
    }

    @Transactional
    public List<TemplateResponse> reorder(Long userId, List<Long> ids) {
        List<Template> found = ordered(userId);
        boolean sameTemplates = ids.size() == found.size()
                && found.stream()
                        .map(Template::getId)
                        .collect(Collectors.toSet())
                        .equals(new HashSet<>(ids));
        if (!sameTemplates) throw new ApiException(400, "A ordem não corresponde aos treinos.");
        Map<Long, Template> byId = found.stream().collect(Collectors.toMap(Template::getId, Function.identity()));
        int position = 1;
        for (Long id : ids) byId.get(id).setPosition(position++);
        return ids.stream().map(byId::get).map(TemplateMapper::toResponse).toList();
    }

    @Transactional
    public TemplateResponse update(Long userId, Long id, TemplateRequest request) {
        Template template = load(userId, id);
        apply(template, request);
        // Grava já, para os exercícios novos voltarem com id.
        return TemplateMapper.toResponse(templates.saveAndFlush(template));
    }

    @Transactional
    public void delete(Long userId, Long id) {
        load(userId, id);
        sessions.unlinkTemplate(id);
        templates.deleteById(id);
    }

    private Template load(Long userId, Long id) {
        return templates.findDetailed(id, userId).orElseThrow(() -> new ApiException(404, "Treino não encontrado."));
    }

    private List<Template> ordered(Long userId) {
        return templates.listByUser(userId).stream().sorted(ROUTINE_ORDER).toList();
    }

    private static void apply(Template template, TemplateRequest request) {
        template.setName(request.name().trim());
        template.setNotes(Values.blankToNull(request.notes()));
        template.setUpdatedAt(Instant.now());
        template.replaceExercises(
                request.exercises().stream().map(TemplateMapper::toEntity).toList());
    }
}
