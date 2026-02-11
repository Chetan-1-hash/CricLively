package com.CricLively.Repository;

import com.CricLively.DTO.ProfileList;
import com.CricLively.Entities.Player;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PlayerRepository extends MongoRepository<Player, String> {

    Boolean existsByIdAndCricketDetailsCompleted(String id, boolean cricketDetailsCompleted);

    List<ProfileList> findAllBy();

}
