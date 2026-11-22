package com.appgym.ranking.domain;

import com.appgym.ranking.Rank;
import java.util.ArrayList;
import java.util.List;

/** A escada: 7 ranks com divisões I, II e III, e os 2 do topo sem divisão. */
public final class RankLadder {
    private RankLadder() {}

    private static final List<String> NUMERALS = List.of("", " I", " II", " III");

    public static final List<Rank> STEPS = build();

    private static List<Rank> build() {
        List<Rank> steps = new ArrayList<>();
        add(steps, "frango", "Frango", 0, 150, 300);
        add(steps, "projeto", "Projeto", 450, 670, 880);
        add(steps, "focado", "Focado", 1100, 1370, 1630);
        add(steps, "maromba", "Maromba", 1900, 2200, 2500);
        add(steps, "casca", "Casca Grossa", 2800, 3130, 3470);
        add(steps, "brabo", "Brabo", 3800, 4170, 4530);
        add(steps, "monstro", "Monstro", 4900, 5330, 5770);
        add(steps, "mutante", "Mutante", 6200);
        add(steps, "lenda", "Lenda", 7300);
        return List.copyOf(steps);
    }

    private static void add(List<Rank> steps, String key, String name, int... floors) {
        for (int i = 0; i < floors.length; i++) {
            int division = floors.length == 1 ? 0 : i + 1;
            steps.add(new Rank(steps.size(), key, name, division, name + NUMERALS.get(division), floors[i]));
        }
    }

    public static Rank of(int points) {
        Rank found = STEPS.get(0);
        for (Rank step : STEPS) {
            if (points >= step.floor()) found = step;
        }
        return found;
    }

    /** O degrau seguinte, ou nulo no topo. */
    public static Rank after(Rank rank) {
        return rank.index() + 1 < STEPS.size() ? STEPS.get(rank.index() + 1) : null;
    }
}
