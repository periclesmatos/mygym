package com.appgym.identity.web;

import com.appgym.identity.application.ProfileService;
import com.appgym.identity.application.dto.ChangePasswordCommand;
import com.appgym.identity.application.dto.DiscoveryCommand;
import com.appgym.identity.application.dto.PhotoCommand;
import com.appgym.identity.application.dto.ProfileView;
import com.appgym.identity.application.dto.UpdateProfileCommand;
import com.appgym.identity.application.dto.UsernameCommand;
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
    public ProfileView get(@AuthenticationPrincipal Long userId) {
        return profile.get(userId);
    }

    @PutMapping
    public ProfileView update(@AuthenticationPrincipal Long userId, @Valid @RequestBody UpdateProfileCommand command) {
        return profile.update(userId, command);
    }

    @PutMapping("/username")
    public ProfileView username(@AuthenticationPrincipal Long userId, @Valid @RequestBody UsernameCommand command) {
        return profile.changeUsername(userId, command);
    }

    @PutMapping("/discovery")
    public ProfileView discovery(@AuthenticationPrincipal Long userId, @Valid @RequestBody DiscoveryCommand command) {
        return profile.changeDiscovery(userId, command);
    }

    @PutMapping("/photo")
    public ProfileView photo(@AuthenticationPrincipal Long userId, @Valid @RequestBody PhotoCommand command) {
        return profile.updatePhoto(userId, command);
    }

    @DeleteMapping("/photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(@AuthenticationPrincipal Long userId) {
        profile.deletePhoto(userId);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal Long userId, @Valid @RequestBody ChangePasswordCommand command) {
        profile.changePassword(userId, command);
    }
}
