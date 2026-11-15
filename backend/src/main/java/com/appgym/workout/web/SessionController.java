package com.appgym.workout.web;

import com.appgym.workout.application.SessionService;
import com.appgym.workout.application.dto.ExerciseInput;
import com.appgym.workout.application.dto.SessionSummaryView;
import com.appgym.workout.application.dto.SessionView;
import com.appgym.workout.application.dto.StartSessionCommand;
import com.appgym.workout.application.dto.UpdateSetCommand;
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
    public List<SessionSummaryView> list(@AuthenticationPrincipal Long userId, @RequestParam String status) {
        return sessions.list(userId, status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionView start(@AuthenticationPrincipal Long userId, @Valid @RequestBody StartSessionCommand command) {
        return sessions.start(userId, command);
    }

    @GetMapping("/{id}")
    public SessionView get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return sessions.get(userId, id);
    }

    @PostMapping("/{id}/exercises")
    public SessionView addExercise(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @Valid @RequestBody ExerciseInput input) {
        return sessions.addExercise(userId, id, input);
    }

    @PostMapping("/{id}/exercises/{exerciseId}/sets")
    public SessionView addSet(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.addSet(userId, id, exerciseId);
    }

    @PutMapping("/{id}/sets/{setId}")
    public SessionView updateSet(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @PathVariable Long setId,
            @Valid @RequestBody UpdateSetCommand command) {
        return sessions.updateSet(userId, id, setId, command);
    }

    @PostMapping("/{id}/finish")
    public SessionView finish(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return sessions.finish(userId, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        sessions.delete(userId, id);
    }

    @DeleteMapping("/{id}/exercises/{exerciseId}")
    public SessionView removeExercise(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.removeExercise(userId, id, exerciseId);
    }

    @DeleteMapping("/{id}/sets/{setId}")
    public SessionView removeSet(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @PathVariable Long setId) {
        return sessions.removeSet(userId, id, setId);
    }
}
