package com.appgym.workout.domain;

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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Entity
@Table(name = "session_exercise")
public class SessionExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 20)
    private String targetReps;

    @Column(precision = 6, scale = 2)
    private BigDecimal targetLoad;

    @Column(nullable = false)
    private int restSeconds;

    private Integer targetRir;

    @OneToMany(mappedBy = "exercise", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<WorkoutSet> sets = new ArrayList<>();

    /** Exercício com as séries planejadas já criadas, todas com a carga e o RIR alvo. */
    public static SessionExercise planned(
            String name,
            int plannedSets,
            String targetReps,
            BigDecimal targetLoad,
            int restSeconds,
            Integer targetRir) {
        SessionExercise exercise = new SessionExercise();
        exercise.name = name;
        exercise.targetReps = targetReps;
        exercise.targetLoad = targetLoad;
        exercise.restSeconds = restSeconds;
        exercise.targetRir = targetRir;
        for (int number = 1; number <= plannedSets; number++) {
            WorkoutSet set = new WorkoutSet();
            set.setLoad(targetLoad);
            set.setRir(targetRir);
            exercise.addSet(set);
        }
        return exercise;
    }

    /** Série nova no fim, repetindo carga e RIR da anterior (ou o alvo, se for a primeira). */
    public WorkoutSet addNextSet() {
        WorkoutSet set = new WorkoutSet();
        lastSet()
                .ifPresentOrElse(
                        previous -> {
                            set.setLoad(previous.getLoad());
                            set.setRir(previous.getRir());
                        },
                        () -> {
                            set.setLoad(targetLoad);
                            set.setRir(targetRir);
                        });
        addSet(set);
        return set;
    }

    /** Acrescenta uma série no fim. */
    public void addSet(WorkoutSet set) {
        set.setExercise(this);
        set.setPosition(sets.size() + 1);
        sets.add(set);
    }

    /** Remove a série e renumera as restantes. */
    public void removeSet(WorkoutSet set) {
        sets.remove(set);
        int position = 1;
        for (WorkoutSet current : sets.stream()
                .sorted(Comparator.comparingInt(current -> current.getPosition()))
                .toList()) {
            current.setPosition(position++);
        }
    }

    public Optional<WorkoutSet> lastSet() {
        return sets.stream().max(Comparator.comparingInt(set -> set.getPosition()));
    }

    public Long getId() {
        return id;
    }

    public Session getSession() {
        return session;
    }

    public void setSession(Session session) {
        this.session = session;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTargetReps() {
        return targetReps;
    }

    public void setTargetReps(String targetReps) {
        this.targetReps = targetReps;
    }

    public BigDecimal getTargetLoad() {
        return targetLoad;
    }

    public void setTargetLoad(BigDecimal targetLoad) {
        this.targetLoad = targetLoad;
    }

    public int getRestSeconds() {
        return restSeconds;
    }

    public void setRestSeconds(int restSeconds) {
        this.restSeconds = restSeconds;
    }

    public Integer getTargetRir() {
        return targetRir;
    }

    public void setTargetRir(Integer targetRir) {
        this.targetRir = targetRir;
    }

    public List<WorkoutSet> getSets() {
        return sets;
    }
}
