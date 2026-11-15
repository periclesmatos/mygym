package com.appgym.profile;

import com.appgym.auth.AuthenticatedUser;
import com.appgym.auth.Emails;
import com.appgym.auth.JwtService;
import com.appgym.auth.LoginResponse;
import com.appgym.auth.User;
import com.appgym.auth.UserRepository;
import com.appgym.error.ApiException;
import java.math.RoundingMode;
import java.util.Base64;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {
    private static final int MAX_PHOTO_BYTES = 512 * 1024;
    private static final Set<String> PHOTO_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Pattern DATA_URL = Pattern.compile("^data:([a-z/+-]+);base64,(.+)$", Pattern.DOTALL);

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
    public ProfileResponse get() {
        User user = current();
        String photo = photos.findById(user.getId())
                .map(p -> "data:" + p.getContentType() + ";base64," + Base64.getEncoder().encodeToString(p.getData()))
                .orElse(null);
        return new ProfileResponse(user.getEmail(), user.getName(), user.getWeightKg(), user.getHeightCm(),
                user.getBirthDate(), user.getCreatedAt(), photo, user.hasPassword(),
                user.getGoogleSub() != null, user.getAppleSub() != null);
    }

    @Transactional
    public ProfileResponse update(ProfileRequests.Update request) {
        User user = current();
        String name = request.name() == null ? null : request.name().trim();
        user.setName(name == null || name.isEmpty() ? null : name);
        user.setWeightKg(request.weightKg() == null ? null : request.weightKg().setScale(2, RoundingMode.HALF_UP));
        user.setHeightCm(request.heightCm());
        user.setBirthDate(request.birthDate());
        return get();
    }

    @Transactional
    public ProfileResponse updatePhoto(ProfileRequests.Photo request) {
        Matcher matcher = DATA_URL.matcher(request.dataUrl());
        if (!matcher.matches() || !PHOTO_TYPES.contains(matcher.group(1))) {
            throw new ApiException(400, "Envie uma imagem JPG, PNG ou WebP.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException exception) {
            throw new ApiException(400, "Não foi possível ler a imagem.");
        }
        if (bytes.length == 0) throw new ApiException(400, "Não foi possível ler a imagem.");
        if (bytes.length > MAX_PHOTO_BYTES) throw new ApiException(400, "A foto pode ter até 512 KB.");

        Long userId = AuthenticatedUser.id();
        UserPhoto photo = photos.findById(userId).orElseGet(() -> new UserPhoto(userId));
        photo.replace(matcher.group(1), bytes);
        photos.save(photo);
        return get();
    }

    @Transactional
    public void deletePhoto() {
        Long userId = AuthenticatedUser.id();
        if (photos.existsById(userId)) photos.deleteById(userId);
    }

    @Transactional
    public LoginResponse changeEmail(ProfileRequests.Email request) {
        User user = current();
        checkPassword(user, request.currentPassword());
        String email = Emails.normalize(request.email());
        if (!email.equals(user.getEmail())) {
            if (users.existsByEmail(email)) throw new ApiException(400, "Já existe uma conta com este e-mail.");
            user.setEmail(email);
        }
        return new LoginResponse(jwt.generate(user), user.getEmail());
    }

    @Transactional
    public void changePassword(ProfileRequests.Password request) {
        User user = current();
        if (user.hasPassword()) checkPassword(user, request.currentPassword());
        user.setPasswordHash(encoder.encode(request.newPassword()));
        user.setPasswordSet(true);
    }

    private void checkPassword(User user, String password) {
        if (!user.hasPassword()) {
            throw new ApiException(400, "Defina uma senha antes de trocar o e-mail.");
        }
        if (password == null || !encoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(400, "Senha atual incorreta.");
        }
    }

    private User current() {
        return users.findById(AuthenticatedUser.id())
                .orElseThrow(() -> new ApiException(401, "Não autenticado."));
    }
}
