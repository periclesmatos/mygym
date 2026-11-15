package com.appgym.workout.application;

import com.appgym.routine.RoutineApi;
import com.appgym.routine.TemplatePlan;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.ConflictException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.shared.util.Values;
import com.appgym.workout.application.dto.ExerciseInput;
import com.appgym.workout.application.dto.SessionSummaryView;
import com.appgym.workout.application.dto.SessionView;
import com.appgym.workout.application.dto.StartSessionCommand;
import com.appgym.workout.application.dto.UpdateSetCommand;
import com.appgym.workout.domain.Session;
import com.appgym.workout.domain.SessionExercise;
import com.appgym.workout.domain.SessionRepository;
import com.appgym.workout.domain.WorkoutSet;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Casos de uso do treino: começar, registrar séries, mexer em exercícios, encerrar e excluir. */
@Service
public class SessionService {
    private final SessionRepository sessions;
    private final RoutineApi routine;

    public SessionService(SessionRepository sessions, RoutineApi routine) {
        this.sessions = sessions;
        this.routine = routine;
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryView> list(Long userId, String status) {
        List<Session> found = switch (status) {
            case "open" -> sessions.listOpen(userId);
            case "finished" -> sessions.listFinished(userId);
            default -> throw new BadRequestException("Use o status open ou finished.");
        };
        return found.stream().map(SessionMapper::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public SessionView get(Long userId, Long id) {
        return SessionMapper.toView(load(userId, id));
    }

    @Transactional
    public SessionView start(Long userId, StartSessionCommand command) {
        if (sessions.hasOpenSession(userId)) {
            throw new ConflictException("Encerre o treino atual antes de começar outro.");
        }
        Session session = new Session();
        session.setUserId(userId);
        session.setStartedAt(Instant.now());
        if (command.templateId() != null) {
            TemplatePlan plan = routine.findTemplate(userId, command.templateId())
                    .orElseThrow(() -> new NotFoundException("Treino não encontrado."));
            session.setTemplateId(plan.id());
            session.setName(plan.name());
            plan.exercises()
                    .forEach(exercise -> session.addExercise(SessionExercise.planned(
                            exercise.name(),
                            exercise.plannedSets(),
                            exercise.reps(),
                            Values.scale2(exercise.load()),
                            exercise.restSeconds(),
                            exercise.rir())));
        } else {
            String name = Values.blankToNull(command.name());
            session.setName(name == null ? "Treino avulso" : name);
            if (command.exercises() != null) {
                command.exercises().forEach(input -> session.addExercise(planned(input)));
            }
        }
        return SessionMapper.toView(sessions.save(session));
    }

    @Transactional
    public SessionView addExercise(Long userId, Long id, ExerciseInput input) {
        Session session = open(userId, id);
        session.addExercise(planned(input));
        return saved(session);
    }

    @Transactional
    public SessionView addSet(Long userId, Long id, Long exerciseId) {
        Session session = open(userId, id);
        exercise(session, exerciseId).addNextSet();
        return saved(session);
    }

    @Transactional
    public SessionView updateSet(Long userId, Long id, Long setId, UpdateSetCommand command) {
        Session session = open(userId, id);
        WorkoutSet set = session.findSet(setId).orElseThrow(() -> new NotFoundException("Série não encontrada."));
        set.setReps(command.reps());
        set.setLoad(Values.scale2(command.load()));
        set.setRir(command.rir());
        set.markCompleted(command.completed(), Instant.now());
        return SessionMapper.toView(session);
    }

    @Transactional
    public SessionView finish(Long userId, Long id) {
        Session session = open(userId, id);
        session.setFinishedAt(Instant.now());
        return SessionMapper.toView(session);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        sessions.delete(load(userId, id));
    }

    @Transactional
    public SessionView removeExercise(Long userId, Long id, Long exerciseId) {
        Session session = open(userId, id);
        session.removeExercise(exercise(session, exerciseId));
        return saved(session);
    }

    @Transactional
    public SessionView removeSet(Long userId, Long id, Long setId) {
        Session session = open(userId, id);
        if (!session.removeSet(setId)) throw new NotFoundException("Série não encontrada.");
        return saved(session);
    }

    private SessionView saved(Session session) {
        return SessionMapper.toView(sessions.saveAndFlush(session));
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

    private static SessionExercise planned(ExerciseInput input) {
        return SessionExercise.planned(
                input.name().trim(),
                input.plannedSets(),
                input.reps().trim(),
                Values.scale2(input.load()),
                input.restSeconds(),
                input.rir());
    }
}
