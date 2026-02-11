package com.CricLively.DTO;

import lombok.Data;
import java.time.LocalDate;
import java.util.Set;

@Data
public class AddTournamentRequest {
    private String name;
    private String coverImage;
    private Set<String> organizerIds;
    private String format;
    private LocalDate startDate;
    private LocalDate endDate;
    private String venue;
}
