package com.CricLively.DTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExtendTournamentRequest {
    private LocalDate newEndDate;
    private String reason;
}
