package com.appgym.social.infrastructure;

import com.appgym.social.domain.Friendship;
import com.appgym.social.domain.FriendshipRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/** O Spring Data implementa a porta {@link FriendshipRepository}. */
interface JpaFriendshipRepository extends Repository<Friendship, Long>, FriendshipRepository {

    @Override
    @Query(value = "select cast(pg_advisory_xact_lock(hashtextextended(:pair, 0)) as text)", nativeQuery = true)
    String lockPair(String pair);

    @Override
    @Query("select f from Friendship f where f.userLow = :low and f.userHigh = :high")
    Optional<Friendship> findPair(Long low, Long high);

    @Override
    @Query("select f from Friendship f where f.userLow = :userId or f.userHigh = :userId order by f.createdAt desc")
    List<Friendship> listFor(Long userId);

    @Override
    @Query("select count(f) from Friendship f where f.acceptedAt is null and f.requestedBy = :userId")
    long countSent(Long userId);

    @Override
    @Query("""
            select count(f) from Friendship f
            where f.acceptedAt is null and f.requestedBy <> :userId
              and (f.userLow = :userId or f.userHigh = :userId)
            """)
    long countReceived(Long userId);
}
