package com.appgym.ranking.application;

import com.appgym.ranking.Rank;
import com.appgym.ranking.application.dto.DetailsView;
import com.appgym.ranking.application.dto.DetailsView.DayEntry;
import com.appgym.ranking.application.dto.DetailsView.Expiry;
import com.appgym.ranking.application.dto.DetailsView.PointsOnDay;
import com.appgym.ranking.application.dto.DetailsView.WeekBonus;
import com.appgym.ranking.application.dto.ImpactView;
import com.appgym.ranking.application.dto.ImpactView.Status;
import com.appgym.ranking.application.dto.OverviewView;
import com.appgym.ranking.application.dto.OverviewView.Fall;
import com.appgym.ranking.application.dto.OverviewView.NextBonus;
import com.appgym.ranking.application.dto.OverviewView.Peak;
import com.appgym.ranking.application.dto.OverviewView.Protection;
import com.appgym.ranking.domain.Achievements;
import com.appgym.ranking.domain.DayScore;
import com.appgym.ranking.domain.RankLadder;
import com.appgym.ranking.domain.RankWindow;
import com.appgym.ranking.domain.RankWindow.Week;
import com.appgym.ranking.domain.ScoringRules;
import com.appgym.ranking.domain.Standing;
import com.appgym.ranking.domain.TrainingLog;
import com.appgym.ranking.domain.Trophy;
import com.appgym.shared.error.NotFoundException;
import com.appgym.workout.LiftSet;
import com.appgym.workout.SessionActivity;
import com.appgym.workout.WorkoutApi;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.NavigableMap;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

/** Casos de uso do rank. Nada é gravado: tudo sai do histórico. */
@Service
public class RankingService {
    private final WorkoutApi workouts;
    private final Clock clock;

    public RankingService(WorkoutApi workouts, Clock clock) {
        this.workouts = workouts;
        this.clock = clock;
    }

    public OverviewView overview(Long userId) {
        return overview(log(workouts.activities(List.of(userId))));
    }

    public DetailsView details(Long userId) {
        TrainingLog log = log(workouts.activities(List.of(userId)));
        NavigableMap<LocalDate, DayScore> days = log.days();
        LocalDate today = log.today();

        List<PointsOnDay> history = new ArrayList<>();
        for (int back = ScoringRules.WINDOW_DAYS - 1; back >= 0; back--) {
            LocalDate date = today.minusDays(back);
            history.add(new PointsOnDay(date, RankWindow.points(days, date)));
        }

        List<Week> weeks = RankWindow.weeks(days, today);
        Set<LocalDate> resting = new HashSet<>();
        weeks.forEach(week -> resting.addAll(week.resting()));
        List<DayEntry> entries = days
                .subMap(today.minusDays(ScoringRules.WINDOW_DAYS - 1L), true, today, true)
                .descendingMap()
                .entrySet()
                .stream()
                .map(entry -> new DayEntry(
                        entry.getKey(),
                        entry.getValue().presence(),
                        entry.getValue().strength(),
                        entry.getValue().cardio(),
                        entry.getValue().total(),
                        resting.contains(entry.getKey())))
                .toList();
        List<WeekBonus> bonuses = weeks.reversed().stream()
                .filter(week -> week.bonus() > 0)
                .map(week -> new WeekBonus(
                        week.start(), week.counted().size() + week.resting().size(), week.bonus()))
                .toList();

        List<Expiry> upcoming = new ArrayList<>();
        int before = RankWindow.points(days, today);
        for (int ahead = 1; ahead <= ScoringRules.PROTECTION_DAYS; ahead++) {
            int after = RankWindow.points(days, today.plusDays(ahead));
            upcoming.add(new Expiry(today.plusDays(ahead), before - after, after));
            before = after;
        }
        return new DetailsView(overview(log), RankLadder.STEPS, history, entries, bonuses, upcoming);
    }

    public ImpactView impact(Long userId, Long sessionId) {
        List<SessionActivity> all = workouts.activities(List.of(userId));
        SessionActivity session = all.stream()
                .filter(item -> item.id().equals(sessionId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Treino não encontrado."));
        TrainingLog with = log(all);
        TrainingLog without =
                log(all.stream().filter(item -> !item.id().equals(sessionId)).toList());
        Standing now = with.standing();
        Standing previous = without.standing();
        int gained = now.points() - previous.points();
        Rank promotion = now.rank().index() > previous.rank().index() ? now.rank() : null;
        return new ImpactView(status(with, session, gained), gained, promotion, unlocked(userId, with, without));
    }

    public List<Trophy> trophies(Long userId) {
        return Achievements.of(log(workouts.activities(List.of(userId))), workouts.lifts(userId));
    }

    private List<Trophy> unlocked(Long userId, TrainingLog with, TrainingLog without) {
        List<LiftSet> lifts = workouts.lifts(userId);
        Set<String> already = Achievements.of(without, lifts).stream()
                .filter(trophy -> trophy.achieved())
                .map(trophy -> trophy.key())
                .collect(Collectors.toSet());
        return Achievements.of(with, lifts).stream()
                .filter(trophy -> trophy.achieved() && !already.contains(trophy.key()))
                .toList();
    }

    private static Status status(TrainingLog log, SessionActivity session, int gained) {
        if (!TrainingLog.onTime(session)) return Status.LATE;
        if (gained > 0) return Status.SCORED;
        LocalDate day = log.day(session);
        if (day.isBefore(log.today().minusDays(ScoringRules.WINDOW_DAYS - 1L))) return Status.EXPIRED;
        return log.days().containsKey(day) ? Status.CAPPED : Status.SHORT;
    }

    private OverviewView overview(TrainingLog log) {
        NavigableMap<LocalDate, DayScore> days = log.days();
        LocalDate today = log.today();
        Standing standing = log.standing();
        Rank rank = standing.rank();
        int points = standing.points();

        Rank next = RankLadder.after(rank);
        int missing = next == null ? 0 : Math.max(0, next.floor() - points);
        double average =
                days.subMap(today.minusDays(ScoringRules.WINDOW_DAYS - 1L), true, today, true).values().stream()
                        .mapToInt(score -> score.total())
                        .average()
                        .orElse(ScoringRules.TYPICAL_DAY);
        double progress =
                next == null ? 1 : Math.max(0, (points - rank.floor()) / (double) (next.floor() - rank.floor()));

        Protection protection = standing.protectedDays() == 0
                ? null
                : new Protection(standing.protectedDays(), standing.pointsToKeep());
        Fall fall = null;
        for (int ahead = 1; ahead <= ScoringRules.PROTECTION_DAYS && fall == null; ahead++) {
            Rank later = Standing.at(days, today.plusDays(ahead)).rank();
            if (later.index() < rank.index()) fall = new Fall(later, ahead);
        }
        List<TrainingLog.Reached> climb = log.climb();
        Peak peak = climb.isEmpty()
                ? new Peak(RankLadder.STEPS.get(0), null)
                : new Peak(climb.getLast().rank(), climb.getLast().date());

        return new OverviewView(
                points,
                rank,
                next,
                missing,
                (int) Math.ceil(missing / average),
                progress,
                days.getOrDefault(today, DayScore.ZERO),
                nextBonus(days, today),
                points - RankWindow.points(days, today.plusDays(1)),
                protection,
                fall,
                peak);
    }

    /** O próximo bônus da semana, se ainda der tempo de alcançar. */
    private static NextBonus nextBonus(NavigableMap<LocalDate, DayScore> days, LocalDate today) {
        LocalDate monday = RankWindow.weekStart(today);
        int trained = days.subMap(monday, true, today, true).size();
        if (trained >= 5) return null;
        int target = Math.max(3, trained + 1);
        int left = 7 - (today.getDayOfWeek().getValue() - 1) - (days.containsKey(today) ? 1 : 0);
        if (target - trained > left) return null;
        return new NextBonus(target - trained, ScoringRules.weekBonus(target) - ScoringRules.weekBonus(trained));
    }

    private TrainingLog log(List<SessionActivity> sessions) {
        return new TrainingLog(sessions, clock.getZone(), LocalDate.now(clock));
    }
}
