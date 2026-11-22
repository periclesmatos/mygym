package com.appgym.identity.domain;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Porta de persistência das fotos de perfil (uma por usuário, com o mesmo id). */
public interface UserPhotoRepository {
    Optional<UserPhoto> findById(Long userId);

    boolean existsById(Long userId);

    /** Quais destes têm foto, sem carregar os bytes. */
    List<Long> idsWithPhoto(Collection<Long> userIds);

    UserPhoto save(UserPhoto photo);

    void delete(UserPhoto photo);
}
