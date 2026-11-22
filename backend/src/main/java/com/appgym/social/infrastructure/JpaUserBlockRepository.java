package com.appgym.social.infrastructure;

import com.appgym.social.domain.UserBlock;
import com.appgym.social.domain.UserBlockRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link UserBlockRepository}. */
interface JpaUserBlockRepository extends Repository<UserBlock, Long>, UserBlockRepository {

    @Override
    @Query("select b from UserBlock b where b.blockerId = :userId or b.blockedId = :userId")
    List<UserBlock> listInvolving(Long userId);

    @Override
    @Query("""
            select count(b) > 0 from UserBlock b
            where (b.blockerId = :first and b.blockedId = :second)
               or (b.blockerId = :second and b.blockedId = :first)
            """)
    boolean existsBetween(Long first, Long second);
}
