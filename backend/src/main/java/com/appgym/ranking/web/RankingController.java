package com.appgym.ranking.web;

import com.appgym.ranking.application.RankingService;
import com.appgym.ranking.application.dto.DetailsView;
import com.appgym.ranking.application.dto.ImpactView;
import com.appgym.ranking.application.dto.OverviewView;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ranking")
public class RankingController {
    private final RankingService ranking;

    public RankingController(RankingService ranking) {
        this.ranking = ranking;
    }

    @GetMapping
    public OverviewView overview(@AuthenticationPrincipal Long userId) {
        return ranking.overview(userId);
    }

    @GetMapping("/details")
    public DetailsView details(@AuthenticationPrincipal Long userId) {
        return ranking.details(userId);
    }

    @GetMapping("/impact/{sessionId}")
    public ImpactView impact(@AuthenticationPrincipal Long userId, @PathVariable Long sessionId) {
        return ranking.impact(userId, sessionId);
    }
}
