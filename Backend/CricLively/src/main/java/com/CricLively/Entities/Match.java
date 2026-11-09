package com.CricLively.Entities;

import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Enums.MatchType;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Document
    public class Match {

    @Id
    private String id;
    private String tournamentId;   // null = a single match that belongs to no tournament
    private String venue;
    private String teamAId;
    private String teamBId;
    private LocalDate date;
    private LocalTime time;
    private Integer oversPerInnings;
    private MatchType matchType;
    private MatchStatus matchStatus;
    private Toss toss;
    private Innings innings1;
    private Innings innings2;
}
