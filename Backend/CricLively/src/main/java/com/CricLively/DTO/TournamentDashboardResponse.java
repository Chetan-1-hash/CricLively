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
}
