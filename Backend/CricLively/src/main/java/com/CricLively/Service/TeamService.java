package com.CricLively.Service;

import com.CricLively.DTO.TeamsList;
import com.CricLively.Entities.Team;
import com.CricLively.Repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final PlayerEligibilityService eligibilityService;

    public void createTeam(Team team){
        List<String> squad = team.getSquadPlayerIds() == null ? List.of() : team.getSquadPlayerIds();

        Set<String> allMembers = new LinkedHashSet<>(squad);
        if (team.getCaptainId() != null && !team.getCaptainId().isBlank()) {
            allMembers.add(team.getCaptainId());
        }
        eligibilityService.requireEligibleToPlay(allMembers, null, "join another team or tournament");

        for (String playerId : squad) {

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
