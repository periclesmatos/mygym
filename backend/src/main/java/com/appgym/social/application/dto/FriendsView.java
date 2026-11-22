package com.appgym.social.application.dto;

import com.appgym.ranking.Rank;
import java.util.List;

/** A tela de amigos. {@code board} inclui a própria pessoa e vem do maior ponto ao menor. */
public record FriendsView(
        List<Standing> board, List<PersonView> received, List<PersonView> sent, List<PersonView> blocked) {

    public record Standing(PersonView person, int points, Rank rank, boolean me) {}
}
