package com.CricLively.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlayerRegisterResponse {
    private String playerId;
    private String firstName;
    private String message;
}
