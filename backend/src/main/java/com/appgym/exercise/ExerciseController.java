package com.appgym.exercise;

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
    public Map<String, ExerciseService.Performance> last(@RequestParam(required = false) List<String> names) {
        return exercises.last(names);
    }

    @GetMapping("/progress")
    public List<ExerciseService.Performance> progress(@RequestParam String name) {
        return exercises.progress(name);
    }
}
