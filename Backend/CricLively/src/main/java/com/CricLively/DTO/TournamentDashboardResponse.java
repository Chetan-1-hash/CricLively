package com.CricLively.DTO;

import com.CricLively.Entities.Enums.TournamentStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TournamentDashboardResponse {
    private String id;
    private String name;
    private String coverImage;
    private LocalDate startDate;
    private LocalDate endDate;
    private String venue;
    private TournamentStatus tournamentStatus;

    private LocalDate originalEndDate;   // endDate above is the extended one when it was extended
    private Boolean finished;            // true once today is after endDate
    private Boolean canExtend;           // may the person asking extend it?
    private List<ExtensionInfo> extensions;

    @Data
    public static class ExtensionInfo {
        private LocalDate previousEndDate;
        private LocalDate newEndDate;
        private String reason;
        private String extendedByName;
        private String extendedAt;
    }
}