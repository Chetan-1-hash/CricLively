package com.CricLively.DTO;

import com.CricLively.Entities.Enums.Role;
import lombok.Data;

import java.util.Set;

/** Body for PUT /admin/profiles/{profileId}/roles, e.g. { "roles": ["ORGANIZER"] } */
@Data
public class UpdateRolesRequest {
    private Set<Role> roles;
}
