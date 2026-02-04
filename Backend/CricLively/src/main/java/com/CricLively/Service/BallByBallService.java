package com.CricLively.Service;

import com.CricLively.Entities.BallByBall;
import com.CricLively.Repository.BallByBallRepository;

public class BallByBallService {

    private final BallByBallRepository ballByBallRepository;

    public BallByBallService(BallByBallRepository ballByBallRepository) {
        this.ballByBallRepository = ballByBallRepository;
    }

    public BallByBall recordBall(BallByBall ballByBall) {
        return ballByBallRepository.save(ballByBall);
    }

}
