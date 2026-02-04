package com.CricLively.Entities;

import com.CricLively.Entities.Enums.Role;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@RequiredArgsConstructor
@Document
public class Profile {

    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    @Indexed(unique = true)
    private String mobileNo;
    private String password;
    private Role role;// Enumeration
    private String playerId; // Null if user is just an admin
    @CreatedDate
    private LocalDateTime registrationDate;
}
