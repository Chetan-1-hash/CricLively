package com.CricLively.DTO;

import com.CricLively.Entities.Enums.BattingStyle;
import com.CricLively.Entities.Enums.BowlingStyle;
import com.CricLively.Entities.Enums.PlayingRole;
import lombok.Data;

@Data
public class PlayerCricketDetailsRequest {
    private BattingStyle battingStyle;
    private BowlingStyle bowlingStyle;
    private PlayingRole playingRole;
}
