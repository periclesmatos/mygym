package com.appgym.session;

import com.appgym.auth.AuthenticatedUser;
import com.appgym.auth.UserRepository;
import com.appgym.error.ApiException;
import com.appgym.template.ExerciseInput;
import com.appgym.template.Numbers;
import com.appgym.template.Template;
import com.appgym.template.TemplateExercise;
import com.appgym.template.TemplateRepository;
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
    public List<SessionSummary> list(String status) {
        Long userId = AuthenticatedUser.id();
        String normalized = switch (status) {
            case "open", "aberta" -> "open";
            case "finished", "encerrada" -> "finished";
            default -> throw new ApiException(400, "Use o status open ou finished.");
        };
        List<Session> found = switch (normalized) {
            case "open" -> sessions.findByUser_IdAndFinishedAtIsNullOrderByStartedAtDesc(userId);
            case "finished" -> sessions.findByUser_IdAndFinishedAtIsNotNullOrderByStartedAtDesc(userId);
            default -> throw new ApiException(400, "Use o status open ou finished.");
        };
        found.forEach(session -> session.getExercises().forEach(exercise -> exercise.getSets().size()));
        return found.stream().map(SessionSummary::of).toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse get(Long id) {
        return SessionResponse.of(load(id));
    }

    @Transactional
    public SessionResponse create(SessionRequest request) {
        Long userId = AuthenticatedUser.id();
        if (sessions.existsByUser_IdAndFinishedAtIsNull(userId)) {
            throw new ApiException(409, "Encerre o treino atual antes de começar outro.");
        }
        Session session = new Session();
        session.setUser(users.findById(userId).orElseThrow(() -> new ApiException(401, "Não autenticado.")));
        session.setStartedAt(Instant.now());
        if (request.templateId() != null) {
            List<Template> found = templates.findDetailed(request.templateId(), userId);
            if (found.isEmpty()) throw new ApiException(404, "Treino não encontrado.");
            Template template = found.get(0);
            session.setTemplate(template);
            session.setName(template.getName());
            template.getExercises().stream()
                    .sorted(Comparator.comparingInt(TemplateExercise::getPosition))
                    .forEach(exercise -> addExercise(session, exercise.getName(), exercise.getPlannedSets(),
                            exercise.getReps(), exercise.getLoad(), exercise.getRestSeconds(), exercise.getRir()));
        } else {
            String name = Numbers.clean(request.name());
            session.setName(name == null ? "Treino avulso" : name);
            if (request.exercises() != null) {
                for (ExerciseInput exercise : request.exercises()) {
                    addExercise(session, exercise.name().trim(), exercise.plannedSets(), exercise.reps().trim(),
                            exercise.load(), exercise.restSeconds(), exercise.rir());
                }
            }
        }
        return SessionResponse.of(sessions.saveAndFlush(session));
    }

    @Transactional
    public SessionResponse addExercise(Long id, ExerciseInput request) {
        Session session = open(id);
        addExercise(session, request.name().trim(), request.plannedSets(), request.reps().trim(),
                request.load(), request.restSeconds(), request.rir());
        sessions.saveAndFlush(session);
        return SessionResponse.of(session);
    }

    @Transactional
    public SessionResponse addSet(Long id, Long exerciseId) {
        Session session = open(id);
        SessionExercise exercise = findExercise(session, exerciseId);
        WorkoutSet set = new WorkoutSet();
        set.setExercise(exercise);
        set.setPosition(exercise.getSets().size() + 1);
        WorkoutSet previous = exercise.getSets().stream()
                .max(Comparator.comparingInt(WorkoutSet::getPosition))
                .orElse(null);
        set.setLoad(previous == null ? exercise.getTargetLoad() : previous.getLoad());
        set.setRir(previous == null ? exercise.getTargetRir() : previous.getRir());
        exercise.getSets().add(set);
        sessions.saveAndFlush(session);
        return SessionResponse.of(session);
    }

    @Transactional
    public SessionResponse updateSet(Long id, Long setId, SetRequest request) {
        Session session = open(id);
        WorkoutSet set = findSet(session, setId);
        set.setReps(request.reps());
        set.setLoad(Numbers.load(request.load()));
        set.setRir(request.rir());
        if (request.completed()) {
            if (set.getCompletedAt() == null) set.setCompletedAt(Instant.now());
        } else {
            set.setCompletedAt(null);
        }
        return SessionResponse.of(session);
    }

    @Transactional
    public SessionResponse finish(Long id) {
        Session session = load(id);
        if (session.getFinishedAt() != null) throw new ApiException(409, "Este treino já foi encerrado.");
        session.setFinishedAt(Instant.now());
        return SessionResponse.of(session);
    }

    private void addExercise(Session session, String name, int plannedSets, String reps, BigDecimal load, int restSeconds, Integer rir) {
        SessionExercise exercise = new SessionExercise();
        exercise.setSession(session);
        exercise.setPosition(session.getExercises().size() + 1);
        exercise.setName(name);
        exercise.setTargetReps(reps);
        exercise.setTargetLoad(Numbers.load(load));
        exercise.setRestSeconds(restSeconds);
        exercise.setTargetRir(rir);
        for (int number = 1; number <= plannedSets; number++) {
            WorkoutSet set = new WorkoutSet();
            set.setExercise(exercise);
            set.setPosition(number);
            set.setLoad(Numbers.load(load));
            set.setRir(rir);
            exercise.getSets().add(set);
        }
        session.getExercises().add(exercise);
    }

    private Session open(Long id) {
        Session session = load(id);
        if (session.getFinishedAt() != null) throw new ApiException(409, "Este treino já foi encerrado.");
        return session;
    }

    private Session load(Long id) {
        List<Session> found = sessions.findDetailed(id, AuthenticatedUser.id());
        if (found.isEmpty()) throw new ApiException(404, "Treino não encontrado.");
        Session session = found.get(0);
        session.getExercises().forEach(exercise -> exercise.getSets().size());
        return session;
    }

    private SessionExercise findExercise(Session session, Long exerciseId) {
        return session.getExercises().stream()
                .filter(exercise -> exercise.getId().equals(exerciseId))
                .findFirst()
                .orElseThrow(() -> new ApiException(404, "Exercício não encontrado."));
    }

    private WorkoutSet findSet(Session session, Long setId) {
        for (SessionExercise exercise : session.getExercises()) {
            for (WorkoutSet set : exercise.getSets()) {
                if (set.getId().equals(setId)) return set;
            }
        }
        throw new ApiException(404, "Série não encontrada.");
    }
}
