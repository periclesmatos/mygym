package com.appgym.template;

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
    public List<TemplateResponse> list() { return templates.list(); }

    @PutMapping("/order")
    public List<TemplateResponse> reorder(@Valid @RequestBody OrderRequest request) {
        return templates.reorder(request.ids());
    }

    @GetMapping("/{id}")
    public TemplateResponse get(@PathVariable Long id) { return templates.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TemplateResponse create(@Valid @RequestBody TemplateRequest request) { return templates.create(request); }

    @PutMapping("/{id}")
    public TemplateResponse update(@PathVariable Long id, @Valid @RequestBody TemplateRequest request) {
        return templates.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { templates.delete(id); }
}
