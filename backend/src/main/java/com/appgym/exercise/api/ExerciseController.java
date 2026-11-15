package com.appgym.exercise.api;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.service.ExerciseService;
import java.util.List;
import java.util.Map;
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
    public List<String> names() {
        return exercises.names();
    }

    @GetMapping("/last")
    public Map<String, Performance> last(@RequestParam(required = false) List<String> names) {
        return exercises.last(names);
    }

    @GetMapping("/progress")
    public List<Performance> progress(@RequestParam String name) {
        return exercises.progress(name);
    }
}
