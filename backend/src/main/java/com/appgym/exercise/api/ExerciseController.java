package com.appgym.exercise.api;

import com.appgym.exercise.api.dto.CatalogItem;
import com.appgym.exercise.api.dto.CustomExerciseRequest;
import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.service.CatalogService;
import com.appgym.exercise.service.ExerciseService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {
    private final ExerciseService exercises;
    private final CatalogService catalog;

    public ExerciseController(ExerciseService exercises, CatalogService catalog) {
        this.exercises = exercises;
        this.catalog = catalog;
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

    @GetMapping("/catalog")
    public List<CatalogItem> catalog(@AuthenticationPrincipal Long userId) {
        return catalog.list(userId);
    }

    @PostMapping("/catalog")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItem createCustom(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody CustomExerciseRequest request) {
        return catalog.create(userId, request);
    }

    @DeleteMapping("/catalog/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCustom(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        catalog.delete(userId, id);
    }
}
