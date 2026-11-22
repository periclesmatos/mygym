package com.appgym.social.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Bloqueio, com direção: quem bloqueou é quem desbloqueia. */
@Entity
@Table(name = "user_block")
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockerId;

    @Column(nullable = false)
    private Long blockedId;

    @Column(nullable = false)
    private Instant createdAt;

    protected UserBlock() {}

    public UserBlock(Long blockerId, Long blockedId, Instant now) {
        this.blockerId = blockerId;
        this.blockedId = blockedId;
        this.createdAt = now;
    }

    public Long getBlockerId() {
        return blockerId;
    }

    public Long getBlockedId() {
        return blockedId;
    }
}
