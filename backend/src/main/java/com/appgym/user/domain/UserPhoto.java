package com.appgym.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Foto fora do app_user para que carregar o usuário em toda requisição não traga os bytes. */
@Entity
@Table(name = "user_photo")
public class UserPhoto {

    @Id
    private Long userId;

    @Column(nullable = false, length = 40)
    private String contentType;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(nullable = false)
    private Instant updatedAt;

    protected UserPhoto() {}

    public UserPhoto(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getContentType() {
        return contentType;
    }

    public byte[] getData() {
        return data;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void replace(String contentType, byte[] data) {
        this.contentType = contentType;
        this.data = data;
        this.updatedAt = Instant.now();
    }
}
