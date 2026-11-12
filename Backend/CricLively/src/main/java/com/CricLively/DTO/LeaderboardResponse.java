package com.CricLively.DTO;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Everybody's numbers for one tournament. The page sorts them into Batting / Bowling / MVP. */
@Data
public class LeaderboardResponse {

    private List<PlayerRow> players = new ArrayList<>();
    private List<String> mvpRules = new ArrayList<>();

    @Data
    public static class PlayerRow {
        private String playerId;   // profile id
        private String name;
        private String team;
        private int matches;

        // batting
        private int battingInnings;
        private int runs;
        private int balls;
        private int highestScore;
        private double average;
        private double strikeRate;
        private int fours;
        private int sixes;
        private int fifties;
        private int hundreds;

        // bowling
        private int bowlingInnings;
        private String overs = "0";
        private int runsConceded;
        private int wickets;
        private String bestFigures = "-";
        private double economy;
        private int dotBalls;

        // fielding
        private int catches;
        private int stumpings;
        private int runOuts;
        private int runOutAssists;

        // MVP
        private int battingPoints;
        private int bowlingPoints;
        private int fieldingPoints;
        private int mvpPoints;
    }
}
