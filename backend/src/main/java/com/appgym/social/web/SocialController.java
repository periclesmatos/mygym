package com.appgym.social.web;

import com.appgym.social.application.SocialService;
import com.appgym.social.application.dto.FriendProfileView;
import com.appgym.social.application.dto.FriendsView;
import com.appgym.social.application.dto.PendingView;
import com.appgym.social.application.dto.PhotoView;
import com.appgym.social.application.dto.SearchCommand;
import com.appgym.social.application.dto.SearchResultView;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/social")
public class SocialController {
    private final SocialService social;

    public SocialController(SocialService social) {
        this.social = social;
    }

    @GetMapping
    public FriendsView overview(@AuthenticationPrincipal Long userId) {
        return social.overview(userId);
    }

    @GetMapping("/pending")
    public PendingView pending(@AuthenticationPrincipal Long userId) {
        return social.pending(userId);
    }

    @PostMapping("/search")
    public List<SearchResultView> search(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody SearchCommand command) {
        return social.search(userId, command);
    }

    @PostMapping("/requests/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void request(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        social.request(userId, id);
    }

    @PostMapping("/requests/{id}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        social.accept(userId, id);
    }

    @DeleteMapping("/relations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        social.remove(userId, id);
    }

    @PostMapping("/blocks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void block(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        social.block(userId, id);
    }

    @DeleteMapping("/blocks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblock(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        social.unblock(userId, id);
    }

    @GetMapping("/friends/{id}")
    public FriendProfileView profile(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        return social.profile(userId, id);
    }

    @GetMapping("/users/{id}/photo")
    public PhotoView photo(@AuthenticationPrincipal Long userId, @PathVariable UUID id) {
        return social.photo(userId, id);
    }
}
