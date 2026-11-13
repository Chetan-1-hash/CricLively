package com.CricLively.DTO;

import lombok.Data;

import java.time.LocalDate;

/**
 * What a person (or an admin) can change about a profile.
 * A field that is left out (null) is NOT changed.
 * Password cannot be changed here on purpose.
 */
@Data
public class UpdateProfileRequest {
    private String firstName;
    private String middleName;   // "" clears it
    private String lastName;
    private LocalDate dob;       // yyyy-MM-dd
    private String email;
    private String mobileNumber;
}
