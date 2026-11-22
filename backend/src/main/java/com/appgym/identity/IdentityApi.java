package com.appgym.identity;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** O que as contas oferecem aos outros módulos: só dados públicos. */
public interface IdentityApi {

    Optional<PublicUser> find(UUID publicId);

    List<PublicUser> findAll(Collection<Long> ids);

    /**
     * Username por prefixo (3 ou mais); e-mail verificado e telefone só exatos e só de quem deixa
     * ser achado por eles.
     */
    List<PublicUser> search(String query);

    /** A foto sem metadados, como data URL. */
    Optional<String> photo(Long userId);
}
