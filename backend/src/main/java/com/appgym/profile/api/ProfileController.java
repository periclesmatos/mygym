package com.appgym.profile.api;

import com.appgym.profile.api.dto.ChangeEmailRequest;
import com.appgym.profile.api.dto.ChangePasswordRequest;
import com.appgym.profile.api.dto.PhotoRequest;
import com.appgym.profile.api.dto.ProfileResponse;
import com.appgym.profile.api.dto.UpdateProfileRequest;
import com.appgym.profile.service.ProfileService;
import com.appgym.shared.security.TokenResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final ProfileService profile;

    public ProfileController(ProfileService profile) {
        this.profile = profile;
    }

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal Long userId) {
        return profile.get(userId);
    }

    @PutMapping
    public ProfileResponse update(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody UpdateProfileRequest request) {
        return profile.update(userId, request);
    }

    @PutMapping("/photo")
    public ProfileResponse photo(@AuthenticationPrincipal Long userId, @Valid @RequestBody PhotoRequest request) {
        return profile.updatePhoto(userId, request);
    }

    @DeleteMapping("/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(@AuthenticationPrincipal Long userId) {
        profile.deletePhoto(userId);
    }

    @PutMapping("/email")
    public TokenResponse email(@AuthenticationPrincipal Long userId, @Valid @RequestBody ChangeEmailRequest request) {
        return profile.changeEmail(userId, request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal Long userId, @Valid @RequestBody ChangePasswordRequest request) {
        profile.changePassword(userId, request);
    }
}
