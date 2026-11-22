package com.appgym.social.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Um par de pessoas, uma linha: pedido enquanto não aceito, depois amizade. */
@Entity
@Table(name = "friendship")
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userLow;

    @Column(nullable = false)
    private Long userHigh;

    @Column(nullable = false)
    private Long requestedBy;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant acceptedAt;

    protected Friendship() {}

    public static Friendship request(Long from, Long to, Instant now) {
        Friendship friendship = new Friendship();
        friendship.userLow = Math.min(from, to);
        friendship.userHigh = Math.max(from, to);
        friendship.requestedBy = from;
        friendship.createdAt = now;
        return friendship;
    }

    public void accept(Instant now) {
        if (acceptedAt == null) acceptedAt = now;
    }

    public boolean isAccepted() {
        return acceptedAt != null;
    }

    public boolean requestedBy(Long userId) {
        return requestedBy.equals(userId);
    }

    public Long other(Long userId) {
        return userLow.equals(userId) ? userHigh : userLow;
    }
}
