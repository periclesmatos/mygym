package com.appgym.profile;

import com.appgym.auth.LoginResponse;
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
    public ProfileResponse get() { return profile.get(); }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody ProfileRequests.Update request) {
        return profile.update(request);
    }

    @PutMapping("/photo")
    public ProfileResponse photo(@Valid @RequestBody ProfileRequests.Photo request) {
        return profile.updatePhoto(request);
    }

    @DeleteMapping("/photo")
    public ResponseEntity<Void> deletePhoto() {
        profile.deletePhoto();
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/email")
    public LoginResponse email(@Valid @RequestBody ProfileRequests.Email request) {
        return profile.changeEmail(request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> password(@Valid @RequestBody ProfileRequests.Password request) {
        profile.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
