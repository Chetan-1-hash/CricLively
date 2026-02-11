package com.CricLively.Entities;

import com.CricLively.Entities.Enums.Role;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@RequiredArgsConstructor
@Document
public class Profile {

    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    @Indexed(unique = true)
    private String mobileNumber;
    private String password;
    private Set<Role> role;// Enumeration
    private String playerId; // Null if user is just an admin
    @CreatedDate
    private LocalDateTime registrationDate;
}
