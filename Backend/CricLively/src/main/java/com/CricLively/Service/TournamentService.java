package com.CricLively.Service;

import com.CricLively.DTO.AddTournamentRequest;
import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Enums.TournamentStatus;
import com.CricLively.Entities.Tournament;
import com.CricLively.Repository.TournamentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
        dto.setId(tournament.getId());
        dto.setName(tournament.getName());
        dto.setCoverImage(tournament.getCoverImage());
        dto.setStartDate(tournament.getStartDate());
        dto.setEndDate(tournament.getEndDate());
        dto.setVenue(tournament.getVenue());
//        dto.setTeamIds(tournament.getTeamIds());
        dto.setTournamentStatus(tournament.getTournamentStatus());

        return dto;
    }


    public void createTournament(AddTournamentRequest addTournament){

        boolean exists = tournamentRepository.existsByNameAndVenueAndStartDateAndEndDate(
                addTournament.getName(),
                addTournament.getVenue(),
                addTournament.getStartDate(),
                addTournament.getEndDate()
        );

        if (exists) {
            throw new RuntimeException("Tournament already exists with the same name, venue and dates.");
        }

        Tournament tournament = new Tournament();
        tournament.setName(addTournament.getName());
        tournament.setCoverImage(addTournament.getCoverImage());
        tournament.setOrganizerIds(addTournament.getOrganizerIds());
        tournament.setFormat(addTournament.getFormat());
        tournament.setStartDate(addTournament.getStartDate());
        tournament.setEndDate(addTournament.getEndDate());
        tournament.setVenue(addTournament.getVenue());
        LocalDate today = LocalDate.now();


        TournamentStatus status =today.isBefore(addTournament.getStartDate())
                        ? TournamentStatus.UPCOMING
                        : TournamentStatus.LIVE;

        tournament.setTournamentStatus(status);
        tournamentRepository.save(tournament);
    }

    public List<String> venuesList(){
        return tournamentRepository.findAll().stream()
                .map(Tournament::getVenue)
                .collect(Collectors.toList());
    }

}
