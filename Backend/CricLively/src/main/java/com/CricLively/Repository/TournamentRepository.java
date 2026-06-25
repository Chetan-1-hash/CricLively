package com.CricLively.Repository;

import com.CricLively.Entities.Tournament;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TournamentRepository extends MongoRepository<Tournament, String> {

    Tournament findTournamentById(String id);

}
