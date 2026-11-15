package com.appgym.session;

import com.appgym.template.ExerciseInput;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
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
@RequestMapping({"/api/sessions", "/api/sessoes"})
public class SessionController {

    private final SessionService sessions;

    public SessionController(SessionService sessions) {
        this.sessions = sessions;
    }

    @GetMapping
    public List<SessionSummary> list(@RequestParam String status) {
        return sessions.list(status);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse create(@Valid @RequestBody SessionRequest request) {
        return sessions.create(request);
    }

    @GetMapping("/{id}")
    public SessionResponse get(@PathVariable Long id) {
        return sessions.get(id);
    }

    @PostMapping("/{id}/exercises")
    public SessionResponse addExercise(@PathVariable Long id, @Valid @RequestBody ExerciseInput request) {
        return sessions.addExercise(id, request);
    }

    @PostMapping("/{id}/exercises/{exerciseId}/sets")
    public SessionResponse addSet(@PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.addSet(id, exerciseId);
    }

    @PutMapping({"/{id}/sets/{setId}", "/{id}/series/{setId}"})
    public SessionResponse updateSet(
            @PathVariable Long id, @PathVariable Long setId, @Valid @RequestBody SetRequest request) {
        return sessions.updateSet(id, setId, request);
    }

    @PostMapping({"/{id}/finish", "/{id}/encerrar"})
    public SessionResponse finish(@PathVariable Long id) {
        return sessions.finish(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        sessions.delete(id);
    }

    @DeleteMapping("/{id}/exercises/{exerciseId}")
    public SessionResponse removeExercise(@PathVariable Long id, @PathVariable Long exerciseId) {
        return sessions.removeExercise(id, exerciseId);
    }

    @DeleteMapping("/{id}/sets/{setId}")
    public SessionResponse removeSet(@PathVariable Long id, @PathVariable Long setId) {
        return sessions.removeSet(id, setId);
    }
}
