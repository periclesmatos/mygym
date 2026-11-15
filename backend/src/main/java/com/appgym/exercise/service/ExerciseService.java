package com.appgym.exercise.service;

import com.appgym.exercise.api.dto.Performance;
import com.appgym.exercise.api.dto.SetDone;
import com.appgym.exercise.domain.ExerciseHistoryRepository;
import com.appgym.session.domain.SessionExercise;
import com.appgym.session.domain.WorkoutSet;
import com.appgym.shared.error.ApiException;
import com.appgym.shared.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExerciseService {

    private final ExerciseHistoryRepository history;

    public ExerciseService(ExerciseHistoryRepository history) {
        this.history = history;
    }

    @Transactional(readOnly = true)
    public List<String> names() {
        Long userId = AuthenticatedUser.id();
        TreeSet<String> names = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        names.addAll(history.templateNames(userId));
        names.addAll(history.sessionNames(userId));
        return new ArrayList<>(names);
    }

    @Transactional(readOnly = true)
    public Map<String, Performance> last(List<String> names) {
        Map<String, Performance> result = new LinkedHashMap<>();
        if (names == null || names.isEmpty()) return result;
        List<String> keys = names.stream()
                .map(ExerciseService::key)
                .filter(name -> !name.isEmpty())
                .distinct()
                .toList();
        if (keys.isEmpty()) return result;
        if (keys.size() > 60) throw new ApiException(400, "Peça no máximo 60 exercícios.");
        for (SessionExercise exercise : history.findFinishedByNames(AuthenticatedUser.id(), keys)) {
            String key = key(exercise.getName());
            if (result.containsKey(key)) continue;
            Performance performance = performance(exercise);
            if (performance != null) result.put(key, performance);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Performance> progress(String name) {
        String key = key(name);
        if (key.isEmpty()) throw new ApiException(400, "Informe o exercício.");
        List<Performance> result = new ArrayList<>();
        for (SessionExercise exercise : history.findFinishedByNames(AuthenticatedUser.id(), List.of(key))) {
            Performance performance = performance(exercise);
            if (performance != null) result.add(performance);
        }
        result.sort(Comparator.comparing(Performance::date));
        return result;
    }

    static String key(String name) {
        return name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
    }

    private static Performance performance(SessionExercise exercise) {
        List<SetDone> sets = exercise.getSets().stream()
                .filter(set -> set.getCompletedAt() != null && set.getReps() != null && set.getReps() > 0)
                .sorted(Comparator.comparingInt(WorkoutSet::getPosition))
                .map(set -> new SetDone(set.getPosition(), set.getReps(), set.getLoad()))
                .toList();
        if (sets.isEmpty()) return null;
        BigDecimal topLoad = null;
        Integer topReps = null;
        BigDecimal volume = BigDecimal.ZERO;
        BigDecimal estimatedMax = null;
        for (SetDone set : sets) {
            BigDecimal load = set.load() == null ? BigDecimal.ZERO : set.load();
            volume = volume.add(load.multiply(BigDecimal.valueOf(set.reps())));
            if (topLoad == null
                    || load.compareTo(topLoad) > 0
                    || (load.compareTo(topLoad) == 0 && set.reps() > topReps)) {
                topLoad = load;
                topReps = set.reps();
            }
            if (load.signum() > 0) {
                // Epley: carga x (1 + reps / 30)
                BigDecimal estimate = load.multiply(BigDecimal.ONE.add(
                        BigDecimal.valueOf(set.reps()).divide(BigDecimal.valueOf(30), 6, RoundingMode.HALF_UP)));
                if (estimatedMax == null || estimate.compareTo(estimatedMax) > 0) estimatedMax = estimate;
            }
        }
        return new Performance(
                exercise.getSession().getId(),
                exercise.getSession().getName(),
                exercise.getSession().getFinishedAt(),
                sets,
                topLoad,
                topReps,
                volume.setScale(2, RoundingMode.HALF_UP),
                estimatedMax == null ? null : estimatedMax.setScale(1, RoundingMode.HALF_UP));
    }
}
