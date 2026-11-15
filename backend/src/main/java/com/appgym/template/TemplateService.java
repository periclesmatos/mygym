package com.appgym.template;

import com.appgym.auth.AuthenticatedUser;
import com.appgym.auth.UserRepository;
import com.appgym.error.ApiException;
import com.appgym.session.SessionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TemplateService {

    private final TemplateRepository templates;
    private final SessionRepository sessions;
    private final UserRepository users;

    public TemplateService(TemplateRepository templates, SessionRepository sessions, UserRepository users) {
        this.templates = templates;
        this.sessions = sessions;
        this.users = users;
    }

    @Transactional
    public List<TemplateResponse> list() {
        return loadOrdered(AuthenticatedUser.id()).stream().map(TemplateResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse get(Long id) {
        return TemplateResponse.of(load(id));
    }

    @Transactional
    public TemplateResponse create(TemplateRequest request) {
        Long userId = AuthenticatedUser.id();
        List<Template> current = loadOrdered(userId);
        int next = current.stream().map(Template::getPosition).max(Comparator.naturalOrder()).orElse(0) + 1;
        Template template = new Template();
        template.setUser(users.findById(userId).orElseThrow(() -> new ApiException(401, "Não autenticado.")));
        template.setCreatedAt(Instant.now());
        template.setPosition(next);
        apply(template, request);
        return TemplateResponse.of(templates.saveAndFlush(template));
    }

    @Transactional
    public List<TemplateResponse> reorder(List<Long> ids) {
        List<Template> found = loadOrdered(AuthenticatedUser.id());
        if (ids.size() != found.size() || !found.stream().map(Template::getId).collect(Collectors.toSet()).equals(new HashSet<>(ids))) {
            throw new ApiException(400, "A ordem não corresponde aos treinos.");
        }
        Map<Long, Template> byId = found.stream().collect(Collectors.toMap(Template::getId, Function.identity()));
        int position = 1;
        List<Template> ordered = new ArrayList<>();
        for (Long id : ids) {
            Template template = byId.get(id);
            template.setPosition(position++);
            ordered.add(template);
        }
        return ordered.stream().map(TemplateResponse::of).toList();
    }

    @Transactional
    public TemplateResponse update(Long id, TemplateRequest request) {
        Template template = load(id);
        apply(template, request);
        templates.saveAndFlush(template);
        return TemplateResponse.of(template);
    }

    @Transactional
    public void delete(Long id) {
        load(id);
        sessions.unlinkTemplate(id);
        templates.deleteById(id);
    }

    private Template load(Long id) {
        List<Template> found = templates.findDetailed(id, AuthenticatedUser.id());
        if (found.isEmpty()) throw new ApiException(404, "Treino não encontrado.");
        return found.get(0);
    }

    private List<Template> loadOrdered(Long userId) {
        List<Template> found = new ArrayList<>(templates.listByUser(userId));
        if (found.stream().anyMatch(template -> template.getPosition() == null)) {
            found.sort(Comparator.comparing(Template::getCreatedAt).thenComparing(Template::getId));
            int position = 1;
            for (Template template : found) template.setPosition(position++);
            templates.saveAll(found);
        } else {
            found.sort(Comparator.comparing(Template::getPosition).thenComparing(Template::getId));
        }
        return found;
    }

    private void apply(Template template, TemplateRequest request) {
        template.setName(request.name().trim());
        template.setNotes(Numbers.clean(request.notes()));
        template.setUpdatedAt(Instant.now());
        template.getExercises().clear();
        int position = 1;
        for (ExerciseInput item : request.exercises()) {
            TemplateExercise exercise = new TemplateExercise();
            exercise.setTemplate(template);
            exercise.setPosition(position++);
            exercise.setName(item.name().trim());
            exercise.setPlannedSets(item.plannedSets());
            exercise.setReps(item.reps().trim());
            exercise.setLoad(Numbers.load(item.load()));
            exercise.setRestSeconds(item.restSeconds());
            exercise.setRir(item.rir());
            template.getExercises().add(exercise);
        }
    }
}
