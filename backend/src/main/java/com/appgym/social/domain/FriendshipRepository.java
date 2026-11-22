package com.appgym.social.domain;

import java.util.List;
import java.util.Optional;

/** Porta de persistência das amizades e pedidos. */
public interface FriendshipRepository {

    /** Serializa tudo o que mexe neste par até o fim da transação. */
    String lockPair(String pair);

    Optional<Friendship> findPair(Long low, Long high);

    List<Friendship> listFor(Long userId);

    long countSent(Long userId);

    long countReceived(Long userId);

    Friendship save(Friendship friendship);

    void delete(Friendship friendship);
}
