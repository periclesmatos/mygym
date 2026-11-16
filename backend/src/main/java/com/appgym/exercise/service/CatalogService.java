package com.appgym.exercise.service;

import com.appgym.exercise.api.dto.CatalogItem;
import com.appgym.exercise.api.dto.CustomExerciseRequest;
import com.appgym.exercise.domain.CatalogExercise;
import com.appgym.exercise.domain.CatalogRepository;
import com.appgym.exercise.domain.MuscleGroups;
import com.appgym.shared.error.BadRequestException;
import com.appgym.shared.error.NotFoundException;
import com.appgym.user.domain.UserRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CatalogService {
    private final CatalogRepository catalog;
    private final UserRepository users;

    public CatalogService(CatalogRepository catalog, UserRepository users) {
        this.catalog = catalog;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<CatalogItem> list(Long userId) {
        return catalog.visibleTo(userId).stream().map(CatalogService::toItem).toList();
    }

    /** Exercício novo do usuário; as sugestões de séries seguem as de um isolado. */
    @Transactional
    public CatalogItem create(Long userId, CustomExerciseRequest request) {
        String name = request.name().trim().replaceAll("\\s+", " ");
        String group = MuscleGroups.group(request.muscleGroup())
                .orElseThrow(() -> new BadRequestException("Grupo muscular inválido."));
        String equipment = null;
        if (request.equipment() != null && !request.equipment().isBlank()) {
            equipment = MuscleGroups.equipment(request.equipment())
                    .orElseThrow(() -> new BadRequestException("Equipamento inválido."));
        }
        String key = MuscleGroups.key(name);
        boolean exists = catalog.visibleTo(userId).stream()
                .anyMatch(item -> MuscleGroups.key(item.getName()).equals(key));
        if (exists) throw new BadRequestException("Esse exercício já está na lista.");

        CatalogExercise exercise = new CatalogExercise();
        exercise.setUser(users.getReferenceById(userId));
        exercise.setName(name);
        exercise.setMuscleGroup(group);
        exercise.setEquipment(equipment);
        boolean cardio = group.equals("Cardio");
        exercise.setKind(cardio ? "cardio" : "isolado");
        exercise.setPlannedSets(cardio ? 1 : 3);
        exercise.setReps(cardio ? "20 min" : "10-12");
        exercise.setRestSeconds(cardio ? 0 : 60);
        return toItem(catalog.saveAndFlush(exercise));
    }

    /** Só os criados pelo usuário saem; os treinos que já usam o nome continuam iguais. */
    @Transactional
    public void delete(Long userId, Long id) {
        catalog.delete(
                catalog.findOwned(id, userId).orElseThrow(() -> new NotFoundException("Exercício não encontrado.")));
    }

    private static CatalogItem toItem(CatalogExercise exercise) {
        return new CatalogItem(
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
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();
    }
}
