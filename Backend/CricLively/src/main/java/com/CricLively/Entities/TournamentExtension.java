package com.CricLively.Entities;

import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

/** One "the organizer made the tournament longer" record: kept forever so everybody can see why. */
@Data
public class TournamentExtension {
    private LocalDate previousEndDate;
    private LocalDate newEndDate;
    private String reason;
    private String extendedBy;      // profile id
    private String extendedByName;
    private Instant extendedAt;
}
