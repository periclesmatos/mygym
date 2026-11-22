package com.appgym.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    /** {@code null} vale como {@code true}: contas antigas sempre tiveram senha. */
    private Boolean passwordSet;

    @Column(length = 80)
    private String name;

    @Column(precision = 5, scale = 2)
    private BigDecimal weightKg;

    private Integer heightCm;

    private LocalDate birthDate;

    private Instant createdAt;

    @Column(unique = true)
    private String googleSub;

    @Column(unique = true)
    private String appleSub;

    /** Quando a pessoa provou ser dona do e-mail; nulo se nunca provou. */
    private Instant emailVerifiedAt;

    /** O id que outras pessoas veem. */
    @Column(nullable = false, unique = true)
    private UUID publicId;

    @Column(length = 20, unique = true)
    private String username;

    @Column(length = 16)
    private String phone;

    @Column(nullable = false)
    private boolean phoneSearchable;

    @Column(nullable = false)
    private boolean emailSearchable = true;

    @PrePersist
    void prePersist() {
        if (publicId == null) publicId = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public boolean hasPassword() {
        return passwordSet == null || passwordSet;
    }

    public void setPasswordSet(boolean passwordSet) {
        this.passwordSet = passwordSet;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(BigDecimal weightKg) {
        this.weightKg = weightKg;
    }

    public Integer getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Integer heightCm) {
        this.heightCm = heightCm;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    /** Guarda o momento da primeira confirmação. */
    public void markEmailVerified(Instant now) {
        if (emailVerifiedAt == null) emailVerifiedAt = now;
    }

    public UUID getPublicId() {
        return publicId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    /** Sem telefone não há busca por telefone. */
    public void changeDiscovery(String phone, boolean phoneSearchable, boolean emailSearchable) {
        this.phone = phone;
        this.phoneSearchable = phone != null && phoneSearchable;
        this.emailSearchable = emailSearchable;
    }

    public String getPhone() {
        return phone;
    }

    public boolean isPhoneSearchable() {
        return phoneSearchable;
    }

    public boolean isEmailSearchable() {
        return emailSearchable;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public void setGoogleSub(String googleSub) {
        this.googleSub = googleSub;
    }

    public String getAppleSub() {
        return appleSub;
    }

    public void setAppleSub(String appleSub) {
        this.appleSub = appleSub;
    }
}
