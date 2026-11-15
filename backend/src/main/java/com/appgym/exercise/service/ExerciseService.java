package com.appgym.exercise.service;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.domain.ExerciseHistoryRepository;
import com.appgym.session.domain.SessionExercise;
import com.appgym.shared.error.ApiException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExerciseService {
    private static final int MAX_NAMES = 60;

    private final ExerciseHistoryRepository history;

    public ExerciseService(ExerciseHistoryRepository history) {
        this.history = history;
    }

    /** Todos os nomes usados em rotinas e treinos, sem repetir. */
    @Transactional(readOnly = true)
    public List<String> names(Long userId) {
        TreeSet<String> names = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        names.addAll(history.templateNames(userId));
        names.addAll(history.sessionNames(userId));
        return new ArrayList<>(names);
    }

    /** Última vez de cada exercício, por chave normalizada do nome. */
    @Transactional(readOnly = true)
    public Map<String, Performance> last(Long userId, List<String> names) {
        Map<String, Performance> result = new LinkedHashMap<>();
        if (names == null || names.isEmpty()) return result;
        List<String> keys = names.stream()
                .map(ExerciseStats::key)
                .filter(name -> !name.isEmpty())
                .distinct()
                .toList();
        if (keys.isEmpty()) return result;
        if (keys.size() > MAX_NAMES) throw new ApiException(400, "Peça no máximo 60 exercícios.");
        // A consulta vem do mais recente para o mais antigo: o primeiro com séries válidas vence.
        for (SessionExercise exercise : history.findFinishedByNames(userId, keys)) {
            String key = ExerciseStats.key(exercise.getName());
            if (!result.containsKey(key)) {
                ExerciseStats.performance(exercise).ifPresent(performance -> result.put(key, performance));
            }
        }
        return result;
    }

    /** Histórico de um exercício, do mais antigo para o mais recente. */
    @Transactional(readOnly = true)
    public List<Performance> progress(Long userId, String name) {
        String key = ExerciseStats.key(name);
        if (key.isEmpty()) throw new ApiException(400, "Informe o exercício.");
        return history.findFinishedByNames(userId, List.of(key)).stream()
                .map(ExerciseStats::performance)
                .flatMap(Optional::stream)
                .sorted(Comparator.comparing(Performance::date))
                .toList();
    }
}
