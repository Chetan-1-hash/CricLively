package com.CricLively.Entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Innings {

    private Integer inningsNumber; // 1 or 2
    private String battingTeamId;
    private String bowlingTeamId;

    // Live Score Summary
    private Integer totalRuns = 0;
    private Integer wicketsLost = 0;
    private Double oversCompleted = 0.0; // e.g., 15.2
    private Integer totalExtras = 0;

    // Key Batsmen & Bowlers (Referencing IDs)
    private String currentStrikerId;
    private String currentNonStrikerId;
    private String currentBowlerId;

    // Fall of Wickets (Useful for Graphs/UI)
    // Map of Wicket Number -> Score at which it fell (e.g., "1": "45/1")
    private List<WicketHistory> fallOfWickets;

    private Boolean isCompleted = false; // Becomes true when 10 wkts down or overs finished
}
