package com.CricLively.RestController;

import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Service.MatchService;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    public List<MatchDashboardDTO> getAllMatches(String tournamentId){
        return matchService.getAllMatches(tournamentId);
    }

}
