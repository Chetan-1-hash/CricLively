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

    private Set<String> followerIds;                // profile ids of people who follow it (can open it)
    private String createdBy;                       // profile id of the organizer who made it
    private List<TournamentExtension> extensions;   // every time the end date was moved

    /** The end date that counts: the original one, or the latest extension. */
    public LocalDate effectiveEndDate() {
        LocalDate end = endDate;
        if (extensions != null) {
            for (TournamentExtension e : extensions) {
                if (e.getNewEndDate() != null && (end == null || e.getNewEndDate().isAfter(end))) {
                    end = e.getNewEndDate();
                }
            }
        }
        return end;
    }

    /** Finished = today is after the (extended) end date. */
    public boolean finishedOn(LocalDate today) {
        LocalDate end = effectiveEndDate();
        return end != null && today.isAfter(end);
    }
}
