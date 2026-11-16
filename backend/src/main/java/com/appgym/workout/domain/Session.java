package com.appgym.workout.domain;

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
        return allSets().map(set -> set.volume()).reduce(BigDecimal.ZERO, (total, volume) -> total.add(volume));
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
