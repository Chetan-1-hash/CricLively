package com.CricLively.Entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PointsTableEntry {
    private String teamId;
    private String teamName;
    private Integer played = 0;
    private Integer won = 0;
    private Integer lost = 0;
    private Integer tied = 0;
    private Integer noResult = 0;
    private Integer points = 0;

    private Double netRunRate = 0.0;
    private List<String> recentPlayedStats;

}
