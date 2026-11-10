package com.CricLively.DTO;

import lombok.Data;

import java.util.List;

/** Who plays today: profile ids picked from each team's squad. */
@Data
public class LineupRequest {
    private List<String> teamA;
    private List<String> teamB;
}
