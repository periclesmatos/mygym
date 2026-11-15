package com.appgym.routine.web;

import com.appgym.routine.application.TemplateService;
import com.appgym.routine.application.dto.ReorderCommand;
import com.appgym.routine.application.dto.SaveTemplateCommand;
import com.appgym.routine.application.dto.TemplateView;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {
    private final TemplateService templates;

    public TemplateController(TemplateService templates) {
        this.templates = templates;
    }

    @GetMapping
    public List<TemplateView> list(@AuthenticationPrincipal Long userId) {
        return templates.list(userId);
    }

    @PutMapping("/order")
    public List<TemplateView> reorder(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody ReorderCommand command) {
        return templates.reorder(userId, command.ids());
    }

    @GetMapping("/{id}")
    public TemplateView get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return templates.get(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateView create(@AuthenticationPrincipal Long userId, @Valid @RequestBody SaveTemplateCommand command) {
        return templates.create(userId, command);
    }

    @PutMapping("/{id}")
    public TemplateView update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody SaveTemplateCommand command) {
        return templates.update(userId, id, command);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        templates.delete(userId, id);
    }
}
