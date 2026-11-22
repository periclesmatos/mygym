package com.appgym.ranking.application;

import com.appgym.ranking.Rank;
import com.appgym.ranking.RankProfile;
import com.appgym.ranking.RankProfile.WonTrophy;
import com.appgym.ranking.RankSummary;
import com.appgym.ranking.RankingApi;
import com.appgym.ranking.domain.Achievements;
import com.appgym.ranking.domain.RankLadder;
import com.appgym.ranking.domain.Standing;
import com.appgym.ranking.domain.TrainingLog;
import com.appgym.workout.SessionActivity;
import com.appgym.workout.WorkoutApi;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Implementação da API pública do módulo. */
@Service
class RankingQueries implements RankingApi {
    private final WorkoutApi workouts;
    private final Clock clock;

    RankingQueries(WorkoutApi workouts, Clock clock) {
        this.workouts = workouts;
        this.clock = clock;
    }

    @Override
    public Map<Long, RankSummary> summaries(Collection<Long> userIds) {
        Map<Long, List<SessionActivity>> byUser =
                workouts.activities(userIds).stream().collect(Collectors.groupingBy(session -> session.userId()));
        Map<Long, RankSummary> result = new HashMap<>();
        for (Long userId : userIds) {
            Standing standing = log(byUser.getOrDefault(userId, List.of())).standing();
            result.put(userId, new RankSummary(standing.points(), standing.rank()));
        }
        return result;
    }

    @Override
    public RankProfile profile(Long userId) {
        TrainingLog log = log(workouts.activities(List.of(userId)));
        Standing standing = log.standing();
        List<TrainingLog.Reached> climb = log.climb();
        Rank peak = climb.isEmpty() ? RankLadder.STEPS.get(0) : climb.getLast().rank();
        List<WonTrophy> won = Achievements.of(log, workouts.lifts(userId)).stream()
                .filter(trophy -> trophy.achieved())
                .map(trophy -> new WonTrophy(trophy.key(), trophy.name(), trophy.tier(), trophy.achievedOn()))
                .sorted(Comparator.comparing((WonTrophy trophy) -> trophy.achievedOn())
                        .reversed())
                .toList();
        YearMonth month = YearMonth.from(log.today());
        List<SessionActivity> thisMonth = log.sessions().stream()
                .filter(session -> YearMonth.from(log.day(session)).equals(month))
                .toList();
        long cardio =
                thisMonth.stream().mapToLong(session -> session.cardioSeconds()).sum() / 60;
        return new RankProfile(standing.points(), standing.rank(), peak, won, log.streak(), thisMonth.size(), cardio);
    }

    private TrainingLog log(List<SessionActivity> sessions) {
        return new TrainingLog(sessions, clock.getZone(), LocalDate.now(clock));
    }
}
