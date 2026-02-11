package com.CricLively.Entities;

import com.CricLively.Entities.Enums.TournamentStatus;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Data
@Document
public class Tournament {
    @Id
    private String id;
    private String name;
    private String coverImage;
    private Set<String> organizerIds;
    private String format;
    private LocalDate startDate;
    private LocalDate endDate;
    private TournamentStatus tournamentStatus;
    private String venue;
    private List<String> teamIds;
    private List<PointsTableEntry> pointsTableEntry;
}
