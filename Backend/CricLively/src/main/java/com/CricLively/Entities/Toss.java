package com.CricLively.Entities;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Toss {

    private String winnerId;
    private enum decision {
        BATTING,
        BOWLING
    }
}
