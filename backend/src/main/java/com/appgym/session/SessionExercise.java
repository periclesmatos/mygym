package com.appgym.session;

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
import java.util.List;

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

    public Long getId() { return id; }
    public Session getSession() { return session; }
    public void setSession(Session session) { this.session = session; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTargetReps() { return targetReps; }
    public void setTargetReps(String targetReps) { this.targetReps = targetReps; }
    public BigDecimal getTargetLoad() { return targetLoad; }
    public void setTargetLoad(BigDecimal targetLoad) { this.targetLoad = targetLoad; }
    public int getRestSeconds() { return restSeconds; }
    public void setRestSeconds(int restSeconds) { this.restSeconds = restSeconds; }
    public Integer getTargetRir() { return targetRir; }
    public void setTargetRir(Integer targetRir) { this.targetRir = targetRir; }
    public List<WorkoutSet> getSets() { return sets; }
}
