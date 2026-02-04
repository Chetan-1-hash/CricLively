package com.CricLively.Entities;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CareerStats {

    // General Summary
    private Integer matchesPlayed = 0;
    private Integer totalInnings = 0;

    // Batting Statistics
    private Integer totalRuns = 0;
    private Integer ballsFaced = 0;
    private Integer highestScore = 0;
    private Integer fifties = 0;
    private Integer hundreds = 0;
    private Integer fours = 0;
    private Integer sixes = 0;
    private Integer notOuts = 0;

    // Bowling Statistics
    private Integer totalWickets = 0;
    private Integer runsConceded = 0;
    private Integer ballsBowled = 0;
    private Integer fiveWicketHauls = 0;
    private String bestBowlingFigures; // e.g., "5/12"

    // Fielding Statistics
    private Integer catches = 0;
    private Integer stumpings = 0;
    private Integer runOuts = 0;

    // Cumulative MVP
    private Double totalMvpPoints = 0.0;

    /**
     * Helper Method: Calculate Batting Average
     */
    public Double getBattingAverage() {
        int dismissals = totalInnings - notOuts;
        if (dismissals <= 0) return (double) totalRuns;
        return (double) totalRuns / dismissals;
    }

    /**
     * Helper Method: Calculate Batting Strike Rate
     */
    public Double getBattingStrikeRate() {
        if (ballsFaced == 0) return 0.0;
        return ((double) totalRuns / ballsFaced) * 100;
    }

    /**
     * Helper Method: Calculate Bowling Economy
     */
    public Double getBowlingEconomy() {
        if (ballsBowled == 0) return 0.0;
        double overs = (double) ballsBowled / 6;
        return (double) runsConceded / overs;
    }
}