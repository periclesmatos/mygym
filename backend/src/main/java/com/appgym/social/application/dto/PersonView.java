package com.appgym.social.application.dto;

import com.appgym.identity.PublicUser;
import java.util.UUID;

/** A prévia: o que quem não é amigo vê. */
public record PersonView(UUID id, String name, String username, boolean hasPhoto) {

    public static PersonView of(PublicUser user) {
        return new PersonView(user.publicId(), user.name(), user.username(), user.hasPhoto());
    }
}
