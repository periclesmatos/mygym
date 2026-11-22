package com.appgym.progress.web;

import com.appgym.progress.application.ProgressService;
import com.appgym.progress.domain.Performance;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises")
public class ProgressController {
    private final ProgressService progress;

    public ProgressController(ProgressService progress) {
        this.progress = progress;
    }

    @GetMapping
    public List<String> names(@AuthenticationPrincipal Long userId) {
        return progress.names(userId);
    }

    @GetMapping("/last")
    public Map<String, Performance> last(
            @AuthenticationPrincipal Long userId,
            @RequestParam(required = false) List<String> names,
            @RequestParam(required = false) Instant before) {
        return progress.last(userId, names, before);
    }

    @GetMapping("/progress")
    public List<Performance> progress(@AuthenticationPrincipal Long userId, @RequestParam String name) {
        return progress.progress(userId, name);
    }
}
