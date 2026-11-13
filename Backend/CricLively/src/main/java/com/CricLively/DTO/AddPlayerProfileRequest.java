package com.CricLively.DTO;

import com.CricLively.Entities.Enums.BattingStyle;
import com.CricLively.Entities.Enums.BowlingStyle;
import com.CricLively.Entities.Enums.PlayingRole;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AddPlayerProfileRequest {
    private String firstName;
    private String middleName;
    private String lastName;
    private LocalDate dob;
    private String email;
    private String mobileNumber;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    private BattingStyle battingStyle;
    private BowlingStyle bowlingStyle;
    private PlayingRole playingRole;
}

