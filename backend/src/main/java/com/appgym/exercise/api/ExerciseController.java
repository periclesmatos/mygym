package com.appgym.exercise.api;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.service.ExerciseService;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {
    private final ExerciseService exercises;

    public ExerciseController(ExerciseService exercises) {
        this.exercises = exercises;
    }

    @GetMapping
    public List<String> names(@AuthenticationPrincipal Long userId) {
        return exercises.names(userId);
    }

    @GetMapping("/last")
    public Map<String, Performance> last(
            @AuthenticationPrincipal Long userId, @RequestParam(required = false) List<String> names) {
        return exercises.last(userId, names);
    }

    @GetMapping("/progress")
    public List<Performance> progress(@AuthenticationPrincipal Long userId, @RequestParam String name) {
        return exercises.progress(userId, name);
    }
}
