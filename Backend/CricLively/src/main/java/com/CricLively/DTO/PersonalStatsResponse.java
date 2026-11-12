package com.CricLively.DTO;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** My own numbers: overall and tournament by tournament. */
@Data
public class PersonalStatsResponse {

    private String playerName;
    private StatLine overall = new StatLine();
    private List<TournamentStats> tournaments = new ArrayList<>();

    @Data
    public static class TournamentStats {
        private String tournamentId;     // null = single matches (no tournament)
        private String tournamentName;
        private StatLine stats = new StatLine();
    }

    @Data
    public static class StatLine {
        private int matches;

        // batting
        private int battingInnings;
        private int runs;
        private int balls;
        private int fours;
        private int sixes;
        private int highestScore;
        private int notOuts;
        private int fifties;
        private int hundreds;
        private double average;
        private double strikeRate;

        // bowling
        private int bowlingInnings;
        private int ballsBowled;
        private String overs = "0";
        private int runsConceded;
        private int wickets;
        private String bestFigures = "-";
        private double economy;

        // fielding
        private int catches;
        private int stumpings;
        private int runOuts;
        private int runOutAssists;

        // helpers used while counting (not shown)
        private transient int outs;
        private transient int bestW = -1;
        private transient int bestR = 0;
    }
}
