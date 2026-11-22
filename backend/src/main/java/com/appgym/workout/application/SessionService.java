package com.appgym.workout.application;

import com.appgym.routine.RoutineApi;
import com.appgym.routine.TemplatePlan;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.ConflictException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.shared.util.Values;
import com.appgym.workout.application.dto.ChangePeriodCommand;
import com.appgym.workout.application.dto.ExerciseInput;
import com.appgym.workout.application.dto.FinishSessionCommand;
import com.appgym.workout.application.dto.LogCardioCommand;
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
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Casos de uso do treino: começar, registrar séries, mexer em exercícios, encerrar, ajustar e excluir. */
@Service
public class SessionService {
    private static final int MAX_EXERCISES = 30;
    private static final int MAX_SETS = 30;
    /** Cliente antigo em cache manda os minutos do cardio no campo de reps. */
    private static final int MAX_LEGACY_MINUTES = 300;

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
        Instant now = Instant.now();
        if (command.startedAt() == null) session.setStartedAt(now);
        else session.startBackdated(command.startedAt(), now);
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
                            exercise.rir(),
                            exercise.cardio())));
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
        if (session.getExercises().size() >= MAX_EXERCISES) {
            throw new BadRequestException("O treino pode ter até 30 exercícios.");
        }
        session.addExercise(planned(input));
        return saved(session);
    }

    @Transactional
    public SessionView addSet(Long userId, Long id, Long exerciseId) {
        Session session = open(userId, id);
        SessionExercise exercise = exercise(session, exerciseId);
        if (exercise.getSets().size() >= MAX_SETS) {
            throw new BadRequestException("Cada exercício pode ter até 30 séries.");
        }
        exercise.addNextSet();
        return saved(session);
    }

    @Transactional
    public SessionView updateSet(Long userId, Long id, Long setId, UpdateSetCommand command) {
        Session session = open(userId, id);
        WorkoutSet set = session.findSet(setId).orElseThrow(() -> new NotFoundException("Série não encontrada."));
        if (set.getExercise().isCardio()) {
            Integer seconds = command.durationSeconds();
            Integer minutes = command.reps();
            if (seconds == null && minutes != null && minutes > 0 && minutes <= MAX_LEGACY_MINUTES) {
                seconds = minutes * 60;
            }
            Integer meters = command.distanceMeters();
            String intensity = command.intensity();
            // O front novo sempre manda intensidade. Sem ela é aba antiga: não apaga o que não conhece.
            if (intensity == null) {
                if (seconds == null) seconds = set.getDurationSeconds();
                if (meters == null) meters = set.getDistanceMeters();
                intensity = set.getIntensity();
            }
            if (command.completed() && seconds == null) {
                throw new BadRequestException("Informe quantos minutos durou.");
            }
            set.measureCardio(seconds, meters, intensity);
        }
        set.setReps(command.reps());
        set.setLoad(Values.scale2(command.load()));
        set.setRir(command.rir());
        set.markCompleted(command.completed(), Instant.now());
        return SessionMapper.toView(session);
    }

    /** Cardio rápido: já nasce concluído e não depende de haver treino aberto. */
    @Transactional
    public SessionView logCardio(Long userId, LogCardioCommand command) {
        Optional<Session> sent = sessions.findByUserIdAndClientKey(userId, command.clientKey());
        if (sent.isPresent()) return SessionMapper.toView(sent.get());
        Instant now = Instant.now();
        String name = command.name().trim();
        Session session = new Session();
        session.setUserId(userId);
        session.setName(name);
        Instant end = command.finishedAt() == null ? now : command.finishedAt();
        session.recordFinished(end, command.durationSeconds(), command.clientKey(), now);
        long minutes = Math.round(command.durationSeconds() / 60.0);
        SessionExercise exercise = SessionExercise.planned(name, 1, minutes + " min", null, 0, null, true);
        WorkoutSet set = exercise.getSets().get(0);
        set.measureCardio(command.durationSeconds(), command.distanceMeters(), command.intensity());
        set.markCompleted(true, now);
        session.addExercise(exercise);
        return saved(session);
    }

    @Transactional
    public SessionView finish(Long userId, Long id, FinishSessionCommand command) {
        Session session = open(userId, id);
        Instant now = Instant.now();
        Instant start = command == null ? null : command.startedAt();
        Instant end = command == null ? null : command.finishedAt();
        if (end == null && session.isBackdated()) {
            throw new BadRequestException("Informe quando o treino terminou.");
        }
        // Encerrar agora não valida: um treino esquecido há dias ainda precisa poder fechar.
        if (start == null && end == null) session.setFinishedAt(now);
        else session.changePeriod(start == null ? session.getStartedAt() : start, end == null ? now : end, now);
        session.markRecorded(now);
        return SessionMapper.toView(session);
    }

    @Transactional
    public SessionView changePeriod(Long userId, Long id, ChangePeriodCommand command) {
        Session session = locked(userId, id);
        if (!session.isFinished()) throw new ConflictException("Encerre o treino antes de ajustar o horário.");
        // Sem registro (gravado por versão antiga): vale o fim original, senão mover para hoje pontuaria.
        session.markRecorded(session.getFinishedAt());
        session.changePeriod(command.startedAt(), command.finishedAt(), Instant.now());
        return SessionMapper.toView(session);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        sessions.delete(locked(userId, id));
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
        Session session = locked(userId, id);
        if (session.isFinished()) throw new ConflictException("Este treino já foi encerrado.");
        return session;
    }

    /** Trava antes de ler, para salvar série, encerrar e apagar não se atropelarem. */
    private Session locked(Long userId, Long id) {
        sessions.findForUpdate(id, userId).orElseThrow(() -> new NotFoundException("Treino não encontrado."));
        return load(userId, id);
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
                input.rir(),
                input.cardio());
    }
}
