package com.appgym.workout.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "workout_set")
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private SessionExercise exercise;

    @Column(nullable = false)
    private int position;

    private Integer reps;

    @Column(name = "load_kg", precision = 6, scale = 2)
    private BigDecimal load;

    private Integer rir;

    private Instant completedAt;

    public boolean isCompleted() {
        return completedAt != null;
    }

    /** Marca ou desmarca a série; o horário da primeira conclusão é mantido. */
    public void markCompleted(boolean completed, Instant now) {
        if (!completed) completedAt = null;
        else if (completedAt == null) completedAt = now;
    }

    /** Carga x reps de uma série concluída (zero se faltar carga ou reps). */
    public BigDecimal volume() {
        if (!isCompleted() || reps == null || load == null) return BigDecimal.ZERO;
        return load.multiply(BigDecimal.valueOf(reps));
    }

    public Long getId() {
        return id;
    }

    public void setExercise(SessionExercise exercise) {
        this.exercise = exercise;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Integer getReps() {
        return reps;
    }

    public void setReps(Integer reps) {
        this.reps = reps;
    }

    public BigDecimal getLoad() {
        return load;
    }

    public void setLoad(BigDecimal load) {
        this.load = load;
    }

    public Integer getRir() {
        return rir;
    }

    public void setRir(Integer rir) {
        this.rir = rir;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
