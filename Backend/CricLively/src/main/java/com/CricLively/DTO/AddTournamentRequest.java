package com.CricLively.DTO;

import com.CricLively.Entities.Enums.TournamentStatus;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Data
public class AddTournamentRequest {
    private String name;
    private MultipartFile coverImage;
    private String organizerId;
    private String format;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer oversPerInnings;
    private TournamentStatus tournamentStatus;
    private List<String> teamIds;
}
