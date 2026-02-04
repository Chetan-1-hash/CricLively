package com.CricLively.Entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document
    public class Match {

    @Id
    private String id;
    private String tournamentId;
    private String teamAId;
    private String teamBId;
    private enum matchStatus {
        LIVE,
        FINISHED,
        ABANDONED
    }
    private Toss toss;
    private Innings innings1;
    private Innings innings2;
}
