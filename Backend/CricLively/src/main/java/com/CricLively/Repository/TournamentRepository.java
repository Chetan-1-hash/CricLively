package com.CricLively.Repository;

import com.CricLively.Entities.Tournament;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TournamentRepository extends MongoRepository<Tournament, String> {

}
