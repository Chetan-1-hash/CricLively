package com.CricLively.DTO;

import lombok.Data;
import org.springframework.data.annotation.Id;

import java.util.List;

@Data
public class TeamsList {
    @Id
    private String id;
    private String tournamentId;
    private String teamName;
    private List<String> squadPlayerIds;
}
