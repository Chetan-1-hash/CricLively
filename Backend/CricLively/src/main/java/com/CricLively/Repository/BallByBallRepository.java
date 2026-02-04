package com.CricLively.Repository;

import com.CricLively.Entities.BallByBall;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BallByBallRepository extends MongoRepository<BallByBall, String> {

    List<BallByBall> findByMatchIdAndInningsNo(String matchId, Integer inningsNo);

}
