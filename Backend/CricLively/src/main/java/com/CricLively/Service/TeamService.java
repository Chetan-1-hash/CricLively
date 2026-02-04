package com.CricLively.Service;

import com.CricLively.Entities.Team;
import com.CricLively.Repository.TeamRepository;

public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService (TeamRepository teamRepository){
        this.teamRepository = teamRepository;
    }

    public Team createTeam(Team team){
        return teamRepository.save(team);
    }

}
