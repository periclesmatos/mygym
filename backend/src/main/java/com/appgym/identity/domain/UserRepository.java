package com.appgym.identity.domain;

import java.util.Optional;

/** Porta de persistência de usuários. */
public interface UserRepository {
    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByAppleSub(String appleSub);

    boolean existsById(Long id);

    boolean existsByEmail(String email);

    long count();

    User save(User user);
}
