package com.appgym.identity.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Porta de persistência de usuários. */
public interface UserRepository {
    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByAppleSub(String appleSub);

    Optional<User> findByPublicId(UUID publicId);

    List<User> findByIdIn(Collection<Long> ids);

    Optional<User> findByUsername(String username);

    /** Por prefixo; o Spring Data escapa % e _. */
    List<User> findTop20ByUsernameStartingWithOrderByUsername(String prefix);

    /** Só quem provou ser dono do e-mail e deixa ser achado por ele. */
    List<User> findByEmailAndEmailSearchableTrueAndEmailVerifiedAtIsNotNull(String email);

    List<User> findTop20ByPhoneAndPhoneSearchableTrueOrderByIdAsc(String phone);

    boolean existsById(Long id);

    boolean existsByEmail(String email);

    long count();

    User save(User user);
}
