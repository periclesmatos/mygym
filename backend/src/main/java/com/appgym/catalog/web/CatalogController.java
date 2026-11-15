package com.appgym.catalog.web;

import com.appgym.catalog.application.CatalogService;
import com.appgym.catalog.application.dto.CatalogItemView;
import com.appgym.catalog.application.dto.CreateCustomExerciseCommand;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exercises/catalog")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public List<CatalogItemView> list(@AuthenticationPrincipal Long userId) {
        return catalog.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogItemView create(
            @AuthenticationPrincipal Long userId, @Valid @RequestBody CreateCustomExerciseCommand command) {
        return catalog.create(userId, command);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        catalog.delete(userId, id);
    }
}
