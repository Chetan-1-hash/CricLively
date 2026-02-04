package com.CricLively.Service;

import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Tournament;
import com.CricLively.Repository.TournamentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TournamentService {

    private final TournamentRepository tournamentRepository;

    public TournamentService(TournamentRepository tournamentRepository){
        this.tournamentRepository = tournamentRepository;
    }

    public List<TournamentDashboardResponse> getTournamentDashboard() {
        return tournamentRepository.findAll()
                .stream()
                .map(this::mapToDashboardResponse)
                .collect(Collectors.toList());
    }

    private TournamentDashboardResponse mapToDashboardResponse(Tournament tournament) {
        TournamentDashboardResponse dto = new TournamentDashboardResponse();
        dto.setName(tournament.getName());
        dto.setCoverImage(tournament.getCoverImage());
        dto.setStartDate(tournament.getStartDate());
        dto.setEndDate(tournament.getEndDate());
        dto.setTeamIds(tournament.getTeamIds());
        dto.setTournamentStatus(tournament.getTournamentStatus());

        return dto;
    }

    public Tournament createTournament(Tournament tournament){
        return tournamentRepository.save(tournament);
    }

}
