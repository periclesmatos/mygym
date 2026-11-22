package com.appgym.ranking.domain;

import com.appgym.workout.LiftSet;
import com.appgym.workout.SessionActivity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.TreeMap;
import java.util.function.Predicate;

/**
 * Os 36 troféus, derivados do histórico que pontua. Como nada é gravado, apagar um treino falso
 * tira o troféu que veio dele.
 */
public final class Achievements {
    /** O mesmo tanto que o app exige para dizer que superou a última vez. */
    private static final double RECORD_MARGIN = 0.05;

    private static final int STRONG_WEEK = 3;

    private final TrainingLog log;
    private final List<Trophy> trophies = new ArrayList<>();

    private Achievements(TrainingLog log) {
        this.log = log;
    }

    private record Goal(double value, String name) {}

    private static Goal goal(double value, String name) {
        return new Goal(value, name);
    }

    public static List<Trophy> of(TrainingLog log, List<LiftSet> lifts) {
        Achievements result = new Achievements(log);
        result.trainingDays();
        result.weeks();
        result.sets();
        result.volume();
        result.records(lifts);
        result.cardioMinutes();
        result.distance();
        result.ranks();
        result.secrets();
        return List.copyOf(result.trophies);
    }

    private void trainingDays() {
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        int count = 0;
        for (LocalDate date : log.days().keySet()) series.put(date, (double) ++count);
        add(
                "days",
                "Treinos",
                "Treine em %s dias.",
                "dias",
                series,
                goal(1, "Primeiro Passo"),
                goal(10, "Pegou Gosto"),
                goal(50, "Cliente da Casa"),
                goal(100, "Centenário"),
                goal(250, "Sócio da Academia"),
                goal(500, "Patrimônio Tombado"));
    }

    private void weeks() {
        Map<LocalDate, Integer> trained = new HashMap<>();
        Map<LocalDate, Integer> runs = new HashMap<>();
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        int best = 0;
        for (LocalDate date : log.days().keySet()) {
            LocalDate week = RankWindow.weekStart(date);
            if (trained.merge(week, 1, Integer::sum) == STRONG_WEEK) {
                int run = runs.getOrDefault(week.minusWeeks(1), 0) + 1;
                runs.put(week, run);
                best = Math.max(best, run);
                series.put(date, (double) best);
            }
        }
        add(
                "weeks",
                "Constância",
                "%s semanas seguidas com 3 ou mais dias.",
                "semanas",
                series,
                goal(2, "Engrenou"),
                goal(4, "Mês Blindado"),
                goal(12, "Sem Desculpa"),
                goal(26, "Meio Ano de Ferro"),
                goal(52, "Inquebrável"));
    }

    private void sets() {
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        double total = 0;
        for (SessionActivity session : log.sessions()) {
            total += session.strengthSets();
            series.put(log.day(session), total);
        }
        add(
                "sets",
                "Séries",
                "Complete %s séries.",
                "séries",
                series,
                goal(100, "Aquecendo"),
                goal(1000, "Operário"),
                goal(5000, "Máquina"),
                goal(10000, "Indestrutível"));
    }

    private void volume() {
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        BigDecimal total = BigDecimal.ZERO;
        for (SessionActivity session : log.sessions()) {
            if (session.volume() != null) total = total.add(session.volume());
            series.put(log.day(session), total.doubleValue() / 1000);
        }
        add(
                "volume",
                "Volume",
                "Levante %s toneladas somadas.",
                "t",
                series,
                goal(10, "Carreto"),
                goal(100, "Guindaste"),
                goal(500, "Cargueiro"),
                goal(1000, "Move Montanhas"));
    }

    private void records(List<LiftSet> lifts) {
        Map<Long, Map<String, Double>> bySession = new HashMap<>();
        for (LiftSet lift : lifts) {
            double max = lift.load().doubleValue() * (1 + lift.reps() / 30.0);
            bySession.computeIfAbsent(lift.sessionId(), key -> new HashMap<>()).merge(lift.nameKey(), max, Math::max);
        }
        Map<String, Double> best = new HashMap<>();
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        int count = 0;
        for (SessionActivity session : log.sessions()) {
            for (Map.Entry<String, Double> done :
                    bySession.getOrDefault(session.id(), Map.of()).entrySet()) {
                Double before = best.get(done.getKey());
                // A primeira vez de um exercício não é recorde.
                if (before != null && done.getValue() > before + RECORD_MARGIN) count++;
                best.merge(done.getKey(), done.getValue(), Math::max);
            }
            series.put(log.day(session), (double) count);
        }
        add(
                "records",
                "Recordes",
                "Bata %s recordes de 1RM estimado.",
                "recordes",
                series,
                goal(1, "Superação"),
                goal(10, "Teto Quebrado"),
                goal(50, "Sem Limites"));
    }

    private void cardioMinutes() {
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        long seconds = 0;
        for (SessionActivity session : log.sessions()) {
            seconds += session.cardioSeconds();
            series.put(log.day(session), (double) (seconds / 60));
        }
        add(
                "cardio",
                "Cardio",
                "Some %s minutos de cardio.",
                "min",
                series,
                goal(60, "Suou"),
                goal(600, "Fôlego"),
                goal(3000, "Pulmão de Aço"),
                goal(10000, "Motor Infinito"));
    }

    private void distance() {
        NavigableMap<LocalDate, Double> series = new TreeMap<>();
        double longest = 0;
        for (SessionActivity session : log.sessions()) {
            longest = Math.max(longest, session.longestDistanceMeters() / 1000.0);
            series.put(log.day(session), longest);
        }
        add(
                "distance",
                "Distância",
                "Faça %s km de uma vez.",
                "km",
                series,
                goal(5, "Cincão"),
                goal(10, "Dezão"),
                goal(21.1, "Meia na Conta"),
                goal(42.2, "Maratonista"));
    }

    private void ranks() {
        List<TrainingLog.Reached> climb = log.climb();
        int points = climb.isEmpty() ? 0 : RankWindow.points(log.days(), log.today());
        rank(1, "projeto", "Saiu do Galinheiro", climb, points);
        rank(2, "casca", "Casca Formada", climb, points);
        rank(3, "monstro", "Virou Monstro", climb, points);
        rank(4, "lenda", "Virou Lenda", climb, points);
    }

    private void rank(int tier, String key, String name, List<TrainingLog.Reached> climb, int points) {
        var step = RankLadder.STEPS.stream()
                .filter(candidate -> candidate.key().equals(key))
                .findFirst()
                .orElseThrow();
        LocalDate date = climb.stream()
                .filter(reached -> reached.rank().index() == step.index())
                .map(reached -> reached.date())
                .findFirst()
                .orElse(null);
        double current = date == null ? points : step.floor();
        String description = "Chegue a " + step.name() + ".";
        trophies.add(
                new Trophy("rank-" + key, "Rank", name, description, tier, current, step.floor(), "pts", date, false));
    }

    private void secrets() {
        LocalTime four = LocalTime.of(4, 0);
        LocalTime six = LocalTime.of(6, 0);
        LocalTime ten = LocalTime.of(22, 0);
        secret(
                "early",
                "Galo Madrugador",
                "Termine um treino ao vivo entre 4h e 6h.",
                time -> !time.isBefore(four) && time.isBefore(six));
        secret("late", "Corujão", "Termine um treino ao vivo entre 22h e meia-noite.", time -> !time.isBefore(ten));
    }

    private void secret(String key, String name, String description, Predicate<LocalTime> when) {
        LocalDate date = log.sessions().stream()
                .filter(session -> !session.backdated())
                .filter(session -> DayScore.qualifies(session.strengthSets(), session.cardioSeconds()))
                .filter(session ->
                        when.test(session.finishedAt().atZone(log.zone()).toLocalTime()))
                .map(log::day)
                .findFirst()
                .orElse(null);
        boolean hidden = date == null;
        trophies.add(new Trophy(
                "secret-" + key,
                "Secretos",
                hidden ? "Troféu secreto" : name,
                hidden ? "Continue treinando para descobrir." : description,
                1,
                hidden ? 0 : 1,
                1,
                "",
                date,
                hidden));
    }

    /** @param series valor acumulado ao fim de cada dia */
    private void add(
            String key,
            String category,
            String description,
            String unit,
            NavigableMap<LocalDate, Double> series,
            Goal... goals) {
        double current = series.isEmpty() ? 0 : series.lastEntry().getValue();
        for (int i = 0; i < goals.length; i++) {
            Goal goal = goals[i];
            LocalDate date = series.entrySet().stream()
                    .filter(entry -> entry.getValue() >= goal.value())
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElse(null);
            String text = goal.value() == 1 ? singular(key) : String.format(description, number(goal.value()));
            trophies.add(new Trophy(
                    key + "-" + (i + 1),
                    category,
                    goal.name(),
                    text,
                    i + 1,
                    Math.min(current, goal.value()),
                    goal.value(),
                    unit,
                    date,
                    false));
        }
    }

    private static String singular(String key) {
        return key.equals("days") ? "Complete seu primeiro dia de treino." : "Bata seu primeiro recorde de 1RM.";
    }

    private static String number(double value) {
        if (value != Math.rint(value)) return String.valueOf(value).replace('.', ',');
        long whole = (long) value;
        return whole < 1000 ? String.valueOf(whole) : whole / 1000 + "." + String.format("%03d", whole % 1000);
    }
}
