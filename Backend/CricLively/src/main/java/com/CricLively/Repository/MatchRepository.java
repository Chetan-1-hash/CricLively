package com.CricLively.Repository;

import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.Match;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MatchRepository extends MongoRepository<Match, String> {

    List<Match> findByTournamentId(String tournamentId);

}
