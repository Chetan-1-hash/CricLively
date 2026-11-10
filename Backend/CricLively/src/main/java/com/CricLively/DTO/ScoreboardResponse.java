package com.CricLively.DTO;

import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Enums.MatchType;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Toss;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/** Everything the scorer page and the scoreboard page need, in ONE response. */
@Data
@Builder
public class ScoreboardResponse {
    private String matchId;
    private String tournamentId;
    private String venue;
    private LocalDate date;
    private LocalTime time;
    private Integer oversPerInnings;
    private MatchStatus matchStatus;
    private MatchType matchType;

    private String teamAId;
    private String teamAName;
    private String teamBId;
    private String teamBName;
    private List<String> squadA;          // player ids
    private List<String> squadB;
    private List<String> playingA;        // who plays today (picked from the squad)
    private List<String> playingB;
    private Map<String, String> playerNames; // player id -> full name (both squads)

    private Toss toss;
    private Innings innings1;
    private Innings innings2;
    private List<BallByBall> balls1;      // every ball of innings 1, in order
    private List<BallByBall> balls2;
}
