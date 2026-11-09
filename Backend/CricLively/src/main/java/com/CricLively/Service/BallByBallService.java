package com.CricLively.Service;

import com.CricLively.Entities.BallByBall;
import com.CricLively.Repository.BallByBallRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BallByBallService {

    private final BallByBallRepository ballByBallRepository;

    public BallByBallService(BallByBallRepository ballByBallRepository) {
        this.ballByBallRepository = ballByBallRepository;
    }

    public BallByBall recordBall(BallByBall ballByBall) {
        return ballByBallRepository.save(ballByBall);
    }

    public List<BallByBall> getBalls(String matchId, Integer inningsNo) {
        return ballByBallRepository.findByMatchIdAndInningsNo(matchId, inningsNo);
    }

}
