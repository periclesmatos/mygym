package com.appgym.identity.application;

import com.appgym.identity.IdentityApi;
import com.appgym.identity.PublicUser;
import com.appgym.identity.domain.Emails;
import com.appgym.identity.domain.Phones;
import com.appgym.identity.domain.PhotoCodec;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserPhotoRepository;
import com.appgym.identity.domain.UserRepository;
import com.appgym.identity.domain.Usernames;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementação da API pública do módulo. */
@Service
class IdentityQueries implements IdentityApi {
    private static final int MIN_PREFIX = 3;

    private final UserRepository users;
    private final UserPhotoRepository photos;

    IdentityQueries(UserRepository users, UserPhotoRepository photos) {
        this.users = users;
        this.photos = photos;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PublicUser> find(UUID publicId) {
        return users.findByPublicId(publicId)
                .map(user -> toPublic(List.of(user)).get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicUser> findAll(Collection<Long> ids) {
        return ids.isEmpty() ? List.of() : toPublic(users.findByIdIn(ids));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PublicUser> search(String query) {
        String text = query.trim();
        if (text.indexOf('@') > 0) {
            return toPublic(users.findByEmailAndEmailSearchableTrueAndEmailVerifiedAtIsNotNull(Emails.normalize(text)));
        }
        if (!text.startsWith("@")) {
            Optional<String> phone = Phones.normalize(text);
            if (phone.isPresent()) {
                return toPublic(users.findTop20ByPhoneAndPhoneSearchableTrueOrderByIdAsc(phone.get()));
            }
        }
        String prefix = Usernames.normalize(text);
        if (prefix.length() < MIN_PREFIX) return List.of();
        return toPublic(users.findTop20ByUsernameStartingWithOrderByUsername(prefix));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> photo(Long userId) {
        return photos.findById(userId).flatMap(PhotoCodec::encodePublic);
    }

    private List<PublicUser> toPublic(List<User> found) {
        if (found.isEmpty()) return List.of();
        Set<Long> withPhoto = Set.copyOf(
                photos.idsWithPhoto(found.stream().map(user -> user.getId()).toList()));
        return found.stream()
                .map(user -> new PublicUser(
                        user.getId(),
                        user.getPublicId(),
                        displayName(user),
                        user.getUsername(),
                        withPhoto.contains(user.getId())))
                .toList();
    }

    /** Nunca cai no e-mail. */
    private static String displayName(User user) {
        if (user.getName() != null) return user.getName();
        return user.getUsername() == null ? "Atleta" : "@" + user.getUsername();
    }
}
