package com.appgym.session.domain;

import com.appgym.template.domain.Template;
import com.appgym.user.domain.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private Template template;

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
                .sorted(Comparator.comparingInt(SessionExercise::getPosition))
                .toList()) {
            current.setPosition(position++);
        }
    }

    public Optional<SessionExercise> findExercise(Long exerciseId) {
        return exercises.stream()
                .filter(exercise -> exercise.getId().equals(exerciseId))
                .findFirst();
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
        return (int) allSets().filter(WorkoutSet::isCompleted).count();
    }

    /** Soma de carga x reps das séries concluídas. */
    public BigDecimal volume() {
        return allSets().map(WorkoutSet::volume).reduce(BigDecimal.ZERO, BigDecimal::add);
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Template getTemplate() {
        return template;
    }

    public void setTemplate(Template template) {
        this.template = template;
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
