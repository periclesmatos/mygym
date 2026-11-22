package com.appgym.identity.application;

import com.appgym.identity.application.dto.ChangePasswordCommand;
import com.appgym.identity.application.dto.DiscoveryCommand;
import com.appgym.identity.application.dto.PhotoCommand;
import com.appgym.identity.application.dto.ProfileView;
import com.appgym.identity.application.dto.UpdateProfileCommand;
import com.appgym.identity.application.dto.UsernameCommand;
import com.appgym.identity.domain.Phones;
import com.appgym.identity.domain.PhotoCodec;
import com.appgym.identity.domain.User;
import com.appgym.identity.domain.UserPhoto;
import com.appgym.identity.domain.UserPhotoRepository;
import com.appgym.identity.domain.UserRepository;
import com.appgym.identity.domain.Usernames;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.UnauthorizedException;
import com.appgym.shared.util.Values;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Dados do perfil, foto e troca de senha do próprio usuário. */
@Service
public class ProfileService {
    private final UserRepository users;
    private final UserPhotoRepository photos;
    private final PasswordEncoder encoder;

    public ProfileService(UserRepository users, UserPhotoRepository photos, PasswordEncoder encoder) {
        this.users = users;
        this.photos = photos;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public ProfileView get(Long userId) {
        return toView(user(userId));
    }

    @Transactional
    public ProfileView update(Long userId, UpdateProfileCommand command) {
        User user = user(userId);
        user.setName(Values.blankToNull(command.name()));
        user.setWeightKg(Values.scale2(command.weightKg()));
        user.setHeightCm(command.heightCm());
        user.setBirthDate(command.birthDate());
        return toView(user);
    }

    @Transactional
    public ProfileView changeUsername(Long userId, UsernameCommand command) {
        User user = user(userId);
        String username = Usernames.parse(command.username());
        boolean taken = users.findByUsername(username)
                .filter(other -> !other.getId().equals(userId))
                .isPresent();
        if (taken) throw new BadRequestException("Esse username já está em uso.");
        user.setUsername(username);
        return toView(user);
    }

    @Transactional
    public ProfileView changeDiscovery(Long userId, DiscoveryCommand command) {
        User user = user(userId);
        String phone = Values.blankToNull(command.phone());
        if (phone != null) {
            phone = Phones.normalize(phone)
                    .orElseThrow(() -> new BadRequestException("Telefone inválido. Use DDD e número."));
        }
        user.changeDiscovery(phone, command.phoneSearchable(), command.emailSearchable());
        return toView(user);
    }

    @Transactional
    public ProfileView updatePhoto(Long userId, PhotoCommand command) {
        PhotoCodec.Decoded decoded = PhotoCodec.decode(command.dataUrl());
        UserPhoto photo = photos.findById(userId).orElseGet(() -> new UserPhoto(userId));
        photo.replace(decoded.contentType(), decoded.data());
        photos.save(photo);
        return toView(user(userId));
    }

    @Transactional
    public void deletePhoto(Long userId) {
        photos.findById(userId).ifPresent(photos::delete);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordCommand command) {
        User user = user(userId);
        if (user.hasPassword()) checkPassword(user, command.currentPassword());
        user.setPasswordHash(encoder.encode(command.newPassword()));
        user.setPasswordSet(true);
    }

    private void checkPassword(User user, String password) {
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Senha atual incorreta.");
        }
    }

    private ProfileView toView(User user) {
        String photo = photos.findById(user.getId()).map(PhotoCodec::encode).orElse(null);
        return new ProfileView(
                user.getEmail(),
                user.getName(),
                user.getWeightKg(),
                user.getHeightCm(),
                user.getBirthDate(),
                user.getCreatedAt(),
                photo,
                user.hasPassword(),
                user.getGoogleSub() != null,
                user.getAppleSub() != null,
                user.getUsername(),
                user.getPhone(),
                user.isPhoneSearchable(),
                user.isEmailSearchable(),
                user.isEmailVerified());
    }

    private User user(Long userId) {
        return users.findById(userId).orElseThrow(() -> UnauthorizedException.notAuthenticated());
    }
}
