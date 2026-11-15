package com.appgym.identity.domain;

import java.util.Optional;

/** Porta de persistência das fotos de perfil (uma por usuário, com o mesmo id). */
public interface UserPhotoRepository {
    Optional<UserPhoto> findById(Long userId);

    UserPhoto save(UserPhoto photo);

    void delete(UserPhoto photo);
}
