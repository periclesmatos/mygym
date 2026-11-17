package com.appgym.catalog.application;

import com.appgym.catalog.MuscleGroups;
import com.appgym.catalog.application.dto.CatalogItemView;
import com.appgym.catalog.application.dto.CreateCustomExerciseCommand;
import com.appgym.catalog.domain.CatalogExercise;
import com.appgym.catalog.domain.CatalogRepository;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.NotFoundException;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Lista o catálogo e cuida dos exercícios criados pelo usuário. */
@Service
public class CatalogService {
    private final CatalogRepository catalog;

    public CatalogService(CatalogRepository catalog) {
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public List<CatalogItemView> list(Long userId) {
        return catalog.visibleTo(userId).stream().map(CatalogService::toView).toList();
    }

    @Transactional
    public CatalogItemView create(Long userId, CreateCustomExerciseCommand command) {
        String name = command.name().trim().replaceAll("\\s+", " ");
        String group = MuscleGroups.group(command.muscleGroup())
                .orElseThrow(() -> new BadRequestException("Grupo muscular inválido."));
        String equipment = null;
        if (command.equipment() != null && !command.equipment().isBlank()) {
            equipment = MuscleGroups.equipment(command.equipment())
                    .orElseThrow(() -> new BadRequestException("Equipamento inválido."));
        }
        String key = MuscleGroups.key(name);
        boolean exists = catalog.visibleTo(userId).stream()
                .anyMatch(item -> MuscleGroups.key(item.getName()).equals(key));
        if (exists) throw new BadRequestException("Esse exercício já está na lista.");

        return toView(catalog.saveAndFlush(CatalogExercise.custom(userId, name, group, equipment)));
    }

    /** Só os criados pelo usuário saem; os treinos que já usam o nome continuam iguais. */
    @Transactional
    public void delete(Long userId, Long id) {
        catalog.delete(
                catalog.findOwned(id, userId).orElseThrow(() -> new NotFoundException("Exercício não encontrado.")));
    }

    private static CatalogItemView toView(CatalogExercise exercise) {
        return new CatalogItemView(
                exercise.getId(),
                exercise.getName(),
                split(exercise.getAliases(), "\\|"),
                exercise.getMuscleGroup(),
                split(exercise.getSecondaryGroups(), ","),
                exercise.getEquipment(),
                exercise.getKind(),
                exercise.getPlannedSets(),
                exercise.getReps(),
                exercise.getRestSeconds(),
                exercise.isCustom());
    }

    private static List<String> split(String value, String separator) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split(separator))
                .map(part -> part.trim())
                .filter(part -> !part.isEmpty())
                .toList();
    }
}
