package com.CricLively.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;

@Data
public class PlayerRegisterRequest {

    private String firstName;
    private String middleName;
    private String lastName;
//    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dob;
    @Indexed(unique = true)
    private String email;
    @Indexed(unique = true)
    private String mobileNumber;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

}
