package com.CricLively.Entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WicketHistory {

    private Integer wicketNumber;    // e.g., 1, 2, 3...
    private String playerOutId;      // Reference to the Player who got out
    private String playerOutName;    // Denormalized for quick UI display

    private Integer teamScoreAtWicket; // Score of the team when this wicket fell
    private Double overAtWicket;      // The exact over (e.g., 14.2)

    private String outType;          // Enum/String: BOWLED, CAUGHT, RUN_OUT, etc.
    private String bowlerId;         // The bowler who took the wicket
    private String fielderId;        // Optional: The player who took the catch/run-out
}
