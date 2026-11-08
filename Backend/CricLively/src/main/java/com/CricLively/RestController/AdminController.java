package com.CricLively.RestController;

import com.CricLively.DTO.UpdateRolesRequest;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Profile;
import com.CricLively.Service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only tools (SecurityConfig blocks everyone else from /admin/**).
 * Login and logout now live in ProfileController - there is one login for all roles.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ProfileService profileService;

    /**
     * Decide what a person is allowed to do.
     * Example body: { "roles": ["ORGANIZER"] }  -> becomes ORGANIZER + PLAYER
     * Everyone always stays a PLAYER.
     */
    @PutMapping("/profiles/{profileId}/roles")
    public ResponseEntity<?> updateRoles(@PathVariable String profileId,
                                         @RequestBody UpdateRolesRequest request,
                                         Authentication auth) {
        try {
            Profile saved = profileService.updateRoles(profileId, request.getRoles(), auth.getName());
            List<String> roles = saved.getRole().stream().map(Role::name).sorted().toList();
            return ResponseEntity.ok(Map.of(
                    "profileId", saved.getId(),
                    "email", saved.getEmail(),
                    "roles", roles
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
