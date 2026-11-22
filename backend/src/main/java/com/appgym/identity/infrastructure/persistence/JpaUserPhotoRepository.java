package com.appgym.identity.infrastructure.persistence;

import com.appgym.identity.domain.UserPhoto;
import com.appgym.identity.domain.UserPhotoRepository;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link UserPhotoRepository}. */
interface JpaUserPhotoRepository extends Repository<UserPhoto, Long>, UserPhotoRepository {

    @Override
    @Query("select p.userId from UserPhoto p where p.userId in :userIds")
    List<Long> idsWithPhoto(Collection<Long> userIds);
}
