package com.CricLively.Entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "ball_by_ball")
@CompoundIndex(def = "{'matchId': 1, 'inningsNo': 1, 'overNo': 1, 'ballNo': 1}")
@Data
public class BallByBall {
    @Id
    private String id;
    private String matchId;
    private Integer inningsNo;
    private Integer overNo;
    private Integer ballNo;
    private String strikerId;
    private String nonStrikerId;
    private String bowlerId;
    private Integer runsBatsman;
    private Integer runsExtra;
    private String extraType; // Wide, NoBall, etc.
    private Wicket wicket; // Null if no wicket
}
