package com.appgym.user.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleSub(String googleSub);

    Optional<User> findByAppleSub(String appleSub);

    boolean existsByEmail(String email);
}
