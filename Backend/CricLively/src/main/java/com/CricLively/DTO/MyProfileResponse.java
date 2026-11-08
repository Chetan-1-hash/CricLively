package com.CricLively.DTO;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * What the frontend gets for "who am I?" - used by login and by GET /profile/me.
 * Never contains the password.
 */
@Data
@Builder
public class MyProfileResponse {

    private String profileId;
    private String playerId;          // null for an admin who is not also a player
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private String dob;               // yyyy-MM-dd, or null
    private String mobileNumber;

    private List<String> roles;       // e.g. ["ORGANIZER", "PLAYER"]

    private Boolean isCricketDetailsCompleted;
    private String battingStyle;
    private String bowlingStyle;
    private String playingRole;
    private String image;             // image id -> shown at /images/{id}

    private String message;           // "Login Successful" on login, null otherwise
}
