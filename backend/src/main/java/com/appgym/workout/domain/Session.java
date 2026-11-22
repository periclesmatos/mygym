package com.appgym.workout.domain;

import com.appgym.shared.error.BadRequestException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Entity
@Table(name = "workout_session")
public class Session {
    private static final Instant EARLIEST = Instant.parse("2000-01-01T00:00:00Z");
    private static final Duration LONGEST = Duration.ofHours(24);
    /** Folga para o relógio do celular um pouco adiantado. */
    private static final Duration CLOCK_SKEW = Duration.ofMinutes(1);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Treino da rotina de onde veio; nulo no treino avulso ou se ele foi excluído. */
    @Column(name = "template_id")
    private Long templateId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant finishedAt;

    /** Registrado depois de feito: não tem cronômetro e o fim é sempre informado. */
    @Column(nullable = false)
    private boolean backdated;

    /** Quando o treino entrou no app como concluído; nunca muda, nem ao ajustar o horário. */
    private Instant recordedAt;

    /** Chave do envio no cardio rápido, para repetir o envio não duplicar o treino. */
    @Column(length = 40)
    private String clientKey;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<SessionExercise> exercises = new ArrayList<>();

    /** Acrescenta um exercício no fim. */
    public void addExercise(SessionExercise exercise) {
        exercise.setSession(this);
        exercise.setPosition(exercises.size() + 1);
        exercises.add(exercise);
    }

    /** Remove o exercício e renumera os restantes. */
    public void removeExercise(SessionExercise exercise) {
        exercises.remove(exercise);
        int position = 1;
        for (SessionExercise current : exercises.stream()
                .sorted(Comparator.comparingInt(current -> current.getPosition()))
                .toList()) {
            current.setPosition(position++);
        }
    }

    public Optional<SessionExercise> findExercise(Long exerciseId) {
        return exercises.stream()
                .filter(exercise -> exercise.getId().equals(exerciseId))
                .findFirst();
    }

    /** Remove a série de qualquer exercício; falso se ela não for deste treino. */
    public boolean removeSet(Long setId) {
        for (SessionExercise exercise : exercises) {
            Optional<WorkoutSet> set = exercise.getSets().stream()
                    .filter(candidate -> candidate.getId().equals(setId))
                    .findFirst();
            if (set.isPresent()) {
                exercise.removeSet(set.get());
                return true;
            }
        }
        return false;
    }

    public Optional<WorkoutSet> findSet(Long setId) {
        return allSets().filter(set -> set.getId().equals(setId)).findFirst();
    }

    /** Começa o registro de um treino que já aconteceu. */
    public void startBackdated(Instant start, Instant now) {
        checkMoment(start, now);
        startedAt = start;
        backdated = true;
    }

    /** Define início e fim informados pelo usuário. */
    public void changePeriod(Instant start, Instant end, Instant now) {
        checkMoment(start, now);
        checkMoment(end, now);
        if (!end.isAfter(start)) throw new BadRequestException("O fim precisa ser depois do início.");
        if (Duration.between(start, end).compareTo(LONGEST) > 0) {
            throw new BadRequestException("O treino pode ter no máximo 24 horas.");
        }
        startedAt = start;
        finishedAt = end;
    }

    private static void checkMoment(Instant moment, Instant now) {
        if (moment.isAfter(now.plus(CLOCK_SKEW))) throw new BadRequestException("O horário não pode ficar no futuro.");
        if (moment.isBefore(EARLIEST)) throw new BadRequestException("Data inválida.");
    }

    public boolean isBackdated() {
        return backdated;
    }

    public boolean isFinished() {
        return finishedAt != null;
    }

    public int totalSets() {
        return (int) allSets().count();
    }

    public int completedSets() {
        return (int) allSets().filter(set -> set.isCompleted()).count();
    }

    /** Soma de carga x reps das séries concluídas. */
    public BigDecimal volume() {
        return exercises.stream()
                .filter(exercise -> !exercise.isCardio())
                .flatMap(exercise -> exercise.getSets().stream())
                .map(set -> set.volume())
                .reduce(BigDecimal.ZERO, (total, volume) -> total.add(volume));
    }

    /** Segundos de cardio concluídos. */
    public long cardioSeconds() {
        return exercises.stream()
                .filter(exercise -> exercise.isCardio())
                .flatMap(exercise -> exercise.getSets().stream())
                .filter(set -> set.isCompleted() && set.getDurationSeconds() != null)
                .mapToLong(set -> set.getDurationSeconds())
                .sum();
    }

    /** Registra de uma vez uma atividade que já terminou. */
    public void recordFinished(Instant end, int durationSeconds, String clientKey, Instant now) {
        changePeriod(end.minusSeconds(durationSeconds), end, now);
        backdated = true;
        this.clientKey = clientKey;
        markRecorded(now);
    }

    /** Só a primeira vez vale. */
    public void markRecorded(Instant now) {
        if (recordedAt == null) recordedAt = now;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    /** Duração em segundos, só para treino concluído. */
    public Long durationSeconds() {
        if (finishedAt == null) return null;
        return Math.max(0, Duration.between(startedAt, finishedAt).getSeconds());
    }

    private Stream<WorkoutSet> allSets() {
        return exercises.stream().flatMap(exercise -> exercise.getSets().stream());
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public List<SessionExercise> getExercises() {
        return exercises;
    }
}
