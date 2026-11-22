package com.appgym.social.domain;

import java.util.List;
import java.util.Optional;

/** Porta de persistência dos bloqueios. */
public interface UserBlockRepository {

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    /** Os feitos por esta pessoa e os contra ela. */
    List<UserBlock> listInvolving(Long userId);

    boolean existsBetween(Long first, Long second);

    UserBlock save(UserBlock block);

    void delete(UserBlock block);
}
