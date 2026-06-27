package com.CricLively.DTO;

import com.CricLively.Entities.Enums.MatchType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AddMatchDTO {
    private String matchId;
    private String tournamentId;
    private String teamAId;
    private String teamBId;
    private LocalDate date;
    private LocalTime time;
    private Integer oversPerInnings;
    private MatchType matchType;
}
