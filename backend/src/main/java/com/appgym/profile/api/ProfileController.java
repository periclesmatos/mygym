package com.appgym.profile.api;

import com.appgym.auth.api.dto.LoginResponse;
import com.appgym.profile.api.dto.ChangeEmailRequest;
import com.appgym.profile.api.dto.ChangePasswordRequest;
import com.appgym.profile.api.dto.PhotoRequest;
import com.appgym.profile.api.dto.ProfileResponse;
import com.appgym.profile.api.dto.UpdateProfileRequest;
import com.appgym.profile.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profile;

    public ProfileController(ProfileService profile) {
        this.profile = profile;
    }

    @GetMapping
    public ProfileResponse get() {
        return profile.get();
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return profile.update(request);
    }

    @PutMapping("/photo")
    public ProfileResponse photo(@Valid @RequestBody PhotoRequest request) {
        return profile.updatePhoto(request);
    }

    @DeleteMapping("/photo")
    public ResponseEntity<Void> deletePhoto() {
        profile.deletePhoto();
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/email")
    public LoginResponse email(@Valid @RequestBody ChangeEmailRequest request) {
        return profile.changeEmail(request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> password(@Valid @RequestBody ChangePasswordRequest request) {
        profile.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
