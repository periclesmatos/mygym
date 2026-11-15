package com.appgym.template.api;

import com.appgym.template.api.dto.OrderRequest;
import com.appgym.template.api.dto.TemplateRequest;
import com.appgym.template.api.dto.TemplateResponse;
import com.appgym.template.service.TemplateService;
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
@RequestMapping({"/api/templates", "/api/fichas"})
public class TemplateController {
    private final TemplateService templates;

    public TemplateController(TemplateService templates) {
        this.templates = templates;
    }

    @GetMapping
    public List<TemplateResponse> list(@AuthenticationPrincipal Long userId) {
        return templates.list(userId);
    }

    @PutMapping("/order")
    public List<TemplateResponse> reorder(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody OrderRequest request) {
        return templates.reorder(userId, request.ids());
    }

    @GetMapping("/{id}")
    public TemplateResponse get(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return templates.get(userId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateResponse create(@AuthenticationPrincipal Long userId, @Valid @RequestBody TemplateRequest request) {
        return templates.create(userId, request);
    }

    @PutMapping("/{id}")
    public TemplateResponse update(
            @AuthenticationPrincipal Long userId, @PathVariable Long id, @Valid @RequestBody TemplateRequest request) {
        return templates.update(userId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        templates.delete(userId, id);
    }
}
