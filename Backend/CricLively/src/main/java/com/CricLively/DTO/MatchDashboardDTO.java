package com.CricLively.DTO;

import com.CricLively.Entities.Enums.MatchStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class MatchDashboardDTO {
    // Basic Info
    private String matchId;
    private String tournamentId;
    private String venue;
    private LocalDate date;
    private LocalTime time;

    // Team Details
    private String teamAName;
    private String teamBName;

    // Status Logic
    private MatchStatus matchStatus; // LIVE, FINISHED, ABANDONED, or UPCOMING

    // Scores (Populated only if status is LIVE or FINISHED)
    private InningsSummaryDTO innings1;
    private InningsSummaryDTO innings2;

    @Data
    @Builder
    public static class InningsSummaryDTO {
        private String battingTeamName;
        private Integer runs;
        private Integer wickets;
        private Double overs;
        private Boolean isCompleted;
    }
}