package com.CricLively.Repository;

import com.CricLively.Entities.Team;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TeamRepository extends MongoRepository<Team, String> {
}
