package com.CricLively.Entities;

import com.CricLively.Entities.Enums.BattingStyle;
import com.CricLively.Entities.Enums.BowlingStyle;
import com.CricLively.Entities.Enums.PlayingRole;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document
public class Player {
    @Id
    private String id;
    private String firstName;
    private String middleName;
    private String lastName;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dob;
    private BattingStyle battingStyle;
    private BowlingStyle bowlingStyle;
    private PlayingRole playingRole;
    private String image;
    private CareerStats careerStats;
    private boolean cricketDetailsCompleted = false; // default false
}

