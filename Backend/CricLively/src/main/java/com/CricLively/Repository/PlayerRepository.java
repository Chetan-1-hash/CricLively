package com.CricLively.Repository;

import com.CricLively.Entities.Player;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PlayerRepository extends MongoRepository<Player, String> {

    Boolean existsByIdAndCricketDetailsCompleted(String id, boolean cricketDetailsCompleted);

}
