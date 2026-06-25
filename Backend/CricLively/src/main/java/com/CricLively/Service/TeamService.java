package com.CricLively.Service;

import com.CricLively.DTO.TeamsList;
import com.CricLively.Entities.Team;
import com.CricLively.Repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService (TeamRepository teamRepository){
        this.teamRepository = teamRepository;
    }

    public void createTeam(Team team){

        for (String playerId : team.getSquadPlayerIds()) {

            if (teamRepository.existsByTournamentIdAndSquadPlayerIdsContaining(
                    team.getTournamentId(),
                    playerId
            )) {
                throw new RuntimeException(
                        "Player already exists in another team"
                );
            }
        }
        teamRepository.save(team);
    }

    public List<TeamsList> fetchTeamNames(){
        return new ArrayList<TeamsList>(this.teamRepository.findAllBy());
    }

}
