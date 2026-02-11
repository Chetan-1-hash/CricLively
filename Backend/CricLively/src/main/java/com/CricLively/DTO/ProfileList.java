package com.CricLively.DTO;

import com.CricLively.Entities.Enums.Role;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.util.Set;

@Data
public class ProfileList {
    private String id;
    private String mobileNumber;
    private String firstName;
    private String middleName;
    private String lastName;
    private Set<Role> role;
}
