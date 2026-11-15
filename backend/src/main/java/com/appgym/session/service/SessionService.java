package com.appgym.session.service;

import com.appgym.session.api.dto.SessionRequest;
import com.appgym.session.api.dto.SessionResponse;
import com.appgym.session.api.dto.SessionSummary;
import com.appgym.session.api.dto.SetRequest;
import com.appgym.session.domain.Session;
import com.appgym.session.domain.SessionExercise;
import com.appgym.session.domain.SessionRepository;
import com.appgym.session.domain.WorkoutSet;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.ConflictException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.shared.util.Values;
import com.appgym.template.api.dto.ExerciseInput;
import com.appgym.template.domain.Template;
import com.appgym.template.domain.TemplateExercise;
import com.appgym.template.domain.TemplateRepository;
import com.appgym.user.domain.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {
    private final SessionRepository sessions;
    private final TemplateRepository templates;
    private final UserRepository users;

    public SessionService(SessionRepository sessions, TemplateRepository templates, UserRepository users) {
        this.sessions = sessions;
        this.templates = templates;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<SessionSummary> list(Long userId, String status) {
        List<Session> found = switch (status) {
            case "open" -> sessions.findByUser_IdAndFinishedAtIsNullOrderByStartedAtDesc(userId);
            case "finished" -> sessions.findByUser_IdAndFinishedAtIsNotNullOrderByStartedAtDesc(userId);
            default -> throw new BadRequestException("Use o status open ou finished.");
        };
        return found.stream().map(SessionMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse get(Long userId, Long id) {
        return SessionMapper.toResponse(load(userId, id));
    }

    @Transactional
    public SessionResponse create(Long userId, SessionRequest request) {
        if (sessions.existsByUser_IdAndFinishedAtIsNull(userId)) {
            throw new ConflictException("Encerre o treino atual antes de começar outro.");
        }
        Session session = new Session();
        session.setUser(users.getReferenceById(userId));
        session.setStartedAt(Instant.now());
        if (request.templateId() != null) {
            Template template = templates
                    .findDetailed(request.templateId(), userId)
                    .orElseThrow(() -> new NotFoundException("Treino não encontrado."));
            session.setTemplate(template);
            session.setName(template.getName());
            template.getExercises().stream()
                    .sorted(Comparator.comparingInt(TemplateExercise::getPosition))
                    .forEach(exercise -> session.addExercise(newExercise(
                            exercise.getName(),
                            exercise.getPlannedSets(),
                            exercise.getReps(),
                            exercise.getLoad(),
                            exercise.getRestSeconds(),
                            exercise.getRir())));
        } else {
            String name = Values.blankToNull(request.name());
            session.setName(name == null ? "Treino avulso" : name);
            if (request.exercises() != null) {
                request.exercises().forEach(input -> session.addExercise(newExercise(input)));
            }
        }
        return SessionMapper.toResponse(sessions.save(session));
    }

    @Transactional
    public SessionResponse addExercise(Long userId, Long id, ExerciseInput request) {
        Session session = open(userId, id);
        session.addExercise(newExercise(request));
        return saved(session);
    }

    @Transactional
    public SessionResponse addSet(Long userId, Long id, Long exerciseId) {
        Session session = open(userId, id);
        SessionExercise exercise = exercise(session, exerciseId);
        WorkoutSet set = new WorkoutSet();
        // A série nova repete carga e RIR da anterior, ou o alvo do exercício.
        exercise.lastSet()
                .ifPresentOrElse(
                        previous -> {
                            set.setLoad(previous.getLoad());
                            set.setRir(previous.getRir());
                        },
                        () -> {
                            set.setLoad(exercise.getTargetLoad());
                            set.setRir(exercise.getTargetRir());
                        });
        exercise.addSet(set);
        return saved(session);
    }

    @Transactional
    public SessionResponse updateSet(Long userId, Long id, Long setId, SetRequest request) {
        Session session = open(userId, id);
        WorkoutSet set = session.findSet(setId).orElseThrow(() -> new NotFoundException("Série não encontrada."));
        set.setReps(request.reps());
        set.setLoad(Values.scale2(request.load()));
        set.setRir(request.rir());
        set.markCompleted(request.completed(), Instant.now());
        return SessionMapper.toResponse(session);
    }

    @Transactional
    public SessionResponse finish(Long userId, Long id) {
        Session session = open(userId, id);
        session.setFinishedAt(Instant.now());
        return SessionMapper.toResponse(session);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        sessions.delete(load(userId, id));
    }

    @Transactional
    public SessionResponse removeExercise(Long userId, Long id, Long exerciseId) {
        Session session = open(userId, id);
        session.removeExercise(exercise(session, exerciseId));
        return saved(session);
    }

    @Transactional
    public SessionResponse removeSet(Long userId, Long id, Long setId) {
        Session session = open(userId, id);
        for (SessionExercise exercise : session.getExercises()) {
            WorkoutSet set = exercise.getSets().stream()
                    .filter(candidate -> candidate.getId().equals(setId))
                    .findFirst()
                    .orElse(null);
            if (set != null) {
                exercise.removeSet(set);
                return saved(session);
            }
        }
        throw new NotFoundException("Série não encontrada.");
    }

    /** Grava já, para que exercícios e séries novos voltem com id na resposta. */
    private SessionResponse saved(Session session) {
        return SessionMapper.toResponse(sessions.saveAndFlush(session));
    }

    private Session open(Long userId, Long id) {
        Session session = load(userId, id);
        if (session.isFinished()) throw new ConflictException("Este treino já foi encerrado.");
        return session;
    }

    private Session load(Long userId, Long id) {
        return sessions.findDetailed(id, userId).orElseThrow(() -> new NotFoundException("Treino não encontrado."));
    }

    private static SessionExercise exercise(Session session, Long exerciseId) {
        return session.findExercise(exerciseId).orElseThrow(() -> new NotFoundException("Exercício não encontrado."));
    }

    private static SessionExercise newExercise(ExerciseInput input) {
        return newExercise(
                input.name().trim(),
                input.plannedSets(),
                input.reps().trim(),
                input.load(),
                input.restSeconds(),
                input.rir());
    }

    private static SessionExercise newExercise(
            String name, int plannedSets, String reps, BigDecimal load, int restSeconds, Integer rir) {
        SessionExercise exercise = new SessionExercise();
        exercise.setName(name);
        exercise.setTargetReps(reps);
        exercise.setTargetLoad(Values.scale2(load));
        exercise.setRestSeconds(restSeconds);
        exercise.setTargetRir(rir);
        for (int number = 1; number <= plannedSets; number++) {
            WorkoutSet set = new WorkoutSet();
            set.setLoad(Values.scale2(load));
            set.setRir(rir);
            exercise.addSet(set);
        }
        return exercise;
    }
}
