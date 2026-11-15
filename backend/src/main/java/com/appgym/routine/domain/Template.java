package com.appgym.routine.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "template")
public class Template {

    /** Ordem da rotina; treinos ainda sem posição vão para o fim, pela data de criação. */
    public static final Comparator<Template> ROUTINE_ORDER = Comparator.comparing(
                    Template::getPosition, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Template::getCreatedAt)
            .thenComparing(Template::getId);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 2000)
    private String notes;

    private Integer position;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<TemplateExercise> exercises = new ArrayList<>();

    /** Troca todos os exercícios, numerando na ordem recebida. */
    public void replaceExercises(List<TemplateExercise> items) {
        exercises.clear();
        int position = 1;
        for (TemplateExercise exercise : items) {
            exercise.setTemplate(this);
            exercise.setPosition(position++);
            exercises.add(exercise);
        }
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<TemplateExercise> getExercises() {
        return exercises;
    }
}
