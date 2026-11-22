package com.appgym.social.application.dto;

import com.appgym.ranking.RankProfile;
import java.time.Instant;
import java.util.List;

/** Perfil de amigo aceito: rank e resumo, sem cargas nem medidas. */
public record FriendProfileView(PersonView person, RankProfile summary, List<RecentWorkout> recent) {

    public record RecentWorkout(String name, Instant finishedAt) {}
}
