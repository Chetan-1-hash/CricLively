package com.CricLively.DTO;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** One line of a tournament's points table. */
@Data
public class PointsTableRow {
    private int position;
    private String teamId;
    private String teamName;
    private String logoImage;
    private int played;
    private int won;
    private int lost;
    private int tied;
    private int noResult;
    private int points;
    private double nrr;                      // net run rate
    private List<String> form = new ArrayList<>(); // last 5: W, L, T, N (oldest first)

    // helpers while counting (not shown)
    private transient int runsFor;
    private transient int ballsFor;
    private transient int runsAgainst;
    private transient int ballsAgainst;
}
