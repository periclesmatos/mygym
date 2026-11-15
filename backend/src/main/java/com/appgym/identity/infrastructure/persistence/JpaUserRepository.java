package com.appgym.identity.infrastructure.persistence;

import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserRepository;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link UserRepository}. */
interface JpaUserRepository extends Repository<User, Long>, UserRepository {}
