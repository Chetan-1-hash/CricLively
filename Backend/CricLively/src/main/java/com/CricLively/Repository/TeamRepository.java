package com.CricLively.Repository;

import com.CricLively.DTO.TeamsList;
import com.CricLively.Entities.Team;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends MongoRepository<Team, String> {

    Team findTeamNameById(String id);
    List<Team> findByTournamentId(String tournamentId);
    List<TeamsList> findAllBy();
    boolean existsByTournamentIdAndSquadPlayerIdsContaining(
            String tournamentId,
            String playerId
    );

}
