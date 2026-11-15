package com.appgym.profile.service;

import com.appgym.profile.api.dto.ChangeEmailRequest;
import com.appgym.profile.api.dto.ChangePasswordRequest;
import com.appgym.profile.api.dto.PhotoRequest;
import com.appgym.profile.api.dto.ProfileResponse;
import com.appgym.profile.api.dto.UpdateProfileRequest;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.UnauthorizedException;
import com.appgym.shared.security.JwtService;
import com.appgym.shared.security.TokenResponse;
import com.appgym.shared.util.Emails;
import com.appgym.shared.util.Values;
import com.appgym.user.domain.User;
import com.appgym.user.domain.UserPhoto;
import com.appgym.user.domain.UserPhotoRepository;
import com.appgym.user.domain.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private final UserRepository users;
    private final UserPhotoRepository photos;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public ProfileService(UserRepository users, UserPhotoRepository photos, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.photos = photos;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(Long userId) {
        return toResponse(user(userId));
    }

    @Transactional
    public ProfileResponse update(Long userId, UpdateProfileRequest request) {
        User user = user(userId);
        user.setName(Values.blankToNull(request.name()));
        user.setWeightKg(Values.scale2(request.weightKg()));
        user.setHeightCm(request.heightCm());
        user.setBirthDate(request.birthDate());
        return toResponse(user);
    }

    @Transactional
    public ProfileResponse updatePhoto(Long userId, PhotoRequest request) {
        PhotoCodec.Decoded decoded = PhotoCodec.decode(request.dataUrl());
        UserPhoto photo = photos.findById(userId).orElseGet(() -> new UserPhoto(userId));
        photo.replace(decoded.contentType(), decoded.data());
        photos.save(photo);
        return toResponse(user(userId));
    }

    @Transactional
    public void deletePhoto(Long userId) {
        photos.findById(userId).ifPresent(photos::delete);
    }

    @Transactional
    public TokenResponse changeEmail(Long userId, ChangeEmailRequest request) {
        User user = user(userId);
        if (!user.hasPassword()) throw new BadRequestException("Defina uma senha antes de trocar o e-mail.");
        checkPassword(user, request.currentPassword());
        String email = Emails.normalize(request.email());
        if (!email.equals(user.getEmail())) {
            if (users.existsByEmail(email)) throw new BadRequestException("Já existe uma conta com este e-mail.");
            user.setEmail(email);
        }
        return jwt.issue(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = user(userId);
        if (user.hasPassword()) checkPassword(user, request.currentPassword());
        user.setPasswordHash(encoder.encode(request.newPassword()));
        user.setPasswordSet(true);
    }

    private void checkPassword(User user, String password) {
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Senha atual incorreta.");
        }
    }

    private ProfileResponse toResponse(User user) {
        String photo = photos.findById(user.getId()).map(PhotoCodec::encode).orElse(null);
        return new ProfileResponse(
                user.getEmail(),
                user.getName(),
                user.getWeightKg(),
                user.getHeightCm(),
                user.getBirthDate(),
                user.getCreatedAt(),
                photo,
                user.hasPassword(),
                user.getGoogleSub() != null,
                user.getAppleSub() != null);
    }

    private User user(Long userId) {
        return users.findById(userId).orElseThrow(() -> UnauthorizedException.notAuthenticated());
    }
}
