package com.CricLively.Entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Document
public class Team {

    @Id
    private String id;
    private String tournamentId;
    private String teamName;
    private String logoImage;
    private String captainId;
    private List<String> squadPlayerIds;
}
