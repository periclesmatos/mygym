package com.appgym.identity.infrastructure.persistence;

import com.appgym.identity.domain.UserPhoto;
import com.appgym.identity.domain.UserPhotoRepository;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link UserPhotoRepository}. */
interface JpaUserPhotoRepository extends Repository<UserPhoto, Long>, UserPhotoRepository {}
