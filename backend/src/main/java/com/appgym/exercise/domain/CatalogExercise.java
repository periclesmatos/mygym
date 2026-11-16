package com.appgym.exercise.domain;

import com.appgym.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Exercício do catálogo: do app (sem dono) ou criado pelo usuário. */
@Entity
@Table(name = "exercise_catalog")
public class CatalogExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 80)
    private String name;

    /** Outros nomes e grafias, separados por "|". */
    @Column(length = 300)
    private String aliases;

    @Column(nullable = false, length = 20)
    private String muscleGroup;

    /** Separados por ",". */
    @Column(length = 120)
    private String secondaryGroups;

    @Column(length = 20)
    private String equipment;

    /** composto, isolado ou cardio. */
    @Column(nullable = false, length = 10)
    private String kind;

    @Column(nullable = false)
    private int plannedSets;

    @Column(nullable = false, length = 20)
    private String reps;

    @Column(nullable = false)
    private int restSeconds;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isCustom() {
        return user != null;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAliases() {
        return aliases;
    }

    public String getMuscleGroup() {
        return muscleGroup;
    }

    public void setMuscleGroup(String muscleGroup) {
        this.muscleGroup = muscleGroup;
    }

    public String getSecondaryGroups() {
        return secondaryGroups;
    }

    public String getEquipment() {
        return equipment;
    }

    public void setEquipment(String equipment) {
        this.equipment = equipment;
    }

    public String getKind() {
        return kind;
    }

    public void setKind(String kind) {
        this.kind = kind;
    }

    public int getPlannedSets() {
        return plannedSets;
    }

    public void setPlannedSets(int plannedSets) {
        this.plannedSets = plannedSets;
    }

    public String getReps() {
        return reps;
    }

    public void setReps(String reps) {
        this.reps = reps;
    }

    public int getRestSeconds() {
        return restSeconds;
    }

    public void setRestSeconds(int restSeconds) {
        this.restSeconds = restSeconds;
    }
}
