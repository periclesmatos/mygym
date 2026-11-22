package com.appgym.ranking;

import java.time.LocalDate;
import java.util.List;

/** O resumo que um amigo pode ver. */
public record RankProfile(
        int points,
        Rank rank,
        Rank peak,
        List<WonTrophy> trophies,
        int streak,
        int monthWorkouts,
        long monthCardioMinutes) {

    public record WonTrophy(String key, String name, int tier, LocalDate achievedOn) {}
}
