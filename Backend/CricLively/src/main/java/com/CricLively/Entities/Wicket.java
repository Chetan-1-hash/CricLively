package com.CricLively.Entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wicket {

    private String playerOutId;    // The ID of the batsman who is out
    private OutType outType;
    public enum OutType {
        BOWLED,
        CAUGHT,
        LBW,
        RUNOUT,
        STUMPED,
        HITWICKET,
        CAUGHT_BOWLED,
        RETIRED_HURT
    }       // Enum/String: BOWLED, CAUGHT, L_B_W, RUN_OUT, STUMPED, HIT_WICKET

    // Attribution
    private String bowlerId;      // The bowler who gets the credit (null for some Run Outs)
    private String fielderId;     // The player who took the catch or performed the run-out
    private String assistantFielderId; // Optional: For combined run-outs (e.g., relay throw)

    private Boolean isBowlerCredit; // True for Bowled, Caught, LBW; False for Run Out
}
