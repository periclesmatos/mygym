package com.appgym.session.api;

import com.appgym.session.api.dto.SessionRequest;
import com.appgym.session.api.dto.SessionResponse;
import com.appgym.session.api.dto.SessionSummary;
import com.appgym.session.api.dto.SetRequest;
import com.appgym.session.service.SessionService;
import com.appgym.template.api.dto.ExerciseInput;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService sessions;

    public SessionController(SessionService sessions) {
        this.sessions = sessions;
    }

    @GetMapping
    public List<SessionSummary> list(@AuthenticationPrincipal Long userId, @RequestParam String status) {
        return sessions.list(userId, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody SessionRequest request) {
        return sessions.create(userId, request);
    }

    @GetMapping("/{id}")
    public SessionResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return sessions.get(userId, id);
    }

    @PostMapping("/{id}/exercises")
    public SessionResponse addExercise(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @Valid @RequestBody ExerciseInput request) {
        return sessions.addExercise(userId, id, request);
    }

    @PostMapping("/{id}/exercises/{exerciseId}/sets")
    public SessionResponse addSet(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.addSet(userId, id, exerciseId);
    }

    @PutMapping("/{id}/sets/{setId}")
    public SessionResponse updateSet(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @PathVariable Long setId,
            @Valid @RequestBody SetRequest request) {
        return sessions.updateSet(userId, id, setId, request);
    }

    @PostMapping("/{id}/finish")
    public SessionResponse finish(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return sessions.finish(userId, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        sessions.delete(userId, id);
    }

    @DeleteMapping("/{id}/exercises/{exerciseId}")
    public SessionResponse removeExercise(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.removeExercise(userId, id, exerciseId);
    }

    @DeleteMapping("/{id}/sets/{setId}")
    public SessionResponse removeSet(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long setId) {
        return sessions.removeSet(userId, id, setId);
    }
}
