package com.appgym.progress.application;

import com.appgym.progress.domain.ExerciseStats;
import com.appgym.progress.domain.Performance;
import com.appgym.routine.RoutineApi;
import com.appgym.shared.error.BadRequestException;
import com.appgym.workout.CompletedExercise;
import com.appgym.workout.WorkoutApi;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;
import org.springframework.stereotype.Service;

/** Nomes de exercício, última vez e histórico de cada exercício. */
@Service
public class ProgressService {
    private static final int MAX_NAMES = 60;

    private final WorkoutApi workouts;
    private final RoutineApi routine;

    public ProgressService(WorkoutApi workouts, RoutineApi routine) {
        this.workouts = workouts;
        this.routine = routine;
    }

    /** Todos os nomes usados em rotinas e treinos, sem repetir. */
    public List<String> names(Long userId) {
        TreeSet<String> names = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        names.addAll(routine.exerciseNames(userId));
        names.addAll(workouts.exerciseNames(userId));
        return new ArrayList<>(names);
    }

    /** Última vez de cada exercício, por chave normalizada do nome. */
    public Map<String, Performance> last(Long userId, List<String> names) {
        Map<String, Performance> result = new LinkedHashMap<>();
        if (names == null || names.isEmpty()) return result;
        List<String> keys = names.stream()
                .map(ExerciseStats::key)
                .filter(name -> !name.isEmpty())
                .distinct()
                .toList();
        if (keys.isEmpty()) return result;
        if (keys.size() > MAX_NAMES) throw new BadRequestException("Peça no máximo 60 exercícios.");
        // Vem do mais recente para o mais antigo: o primeiro com séries válidas vence.
        for (CompletedExercise exercise : workouts.finishedExercises(userId, keys)) {
            String key = ExerciseStats.key(exercise.name());
            if (!result.containsKey(key)) {
                ExerciseStats.performance(exercise).ifPresent(performance -> result.put(key, performance));
            }
        }
        return result;
    }

    /** Histórico de um exercício, do mais antigo para o mais recente. */
    public List<Performance> progress(Long userId, String name) {
        String key = ExerciseStats.key(name);
        if (key.isEmpty()) throw new BadRequestException("Informe o exercício.");
        return workouts.finishedExercises(userId, List.of(key)).stream()
                .map(ExerciseStats::performance)
                .flatMap(Optional::stream)
                .sorted(Comparator.comparing(Performance::date))
                .toList();
    }
}
