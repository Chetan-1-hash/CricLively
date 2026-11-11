package com.CricLively.RestController;

import com.CricLively.DTO.MyProfileResponse;
import com.CricLively.DTO.UpdateProfileRequest;
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
import java.util.NoSuchElementException;

/**
 * Admin-only tools (SecurityConfig blocks everyone else from /admin/**).
 * Login and logout now live in ProfileController - there is one login for all roles.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ProfileService profileService;

    /** Every profile (admin only). */
    @GetMapping("/profiles")
    public List<MyProfileResponse> allProfiles() {
        return profileService.getAllProfiles();
    }

    @GetMapping("/profiles/{profileId}")
    public ResponseEntity<?> oneProfile(@PathVariable String profileId) {
        try {
            return ResponseEntity.ok(profileService.getProfileById(profileId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    /** Edit anybody's name, date of birth and mobile number. (Cricket details: PUT /player/{playerId}/playerInfo) */
    @PutMapping("/profiles/{profileId}")
    public ResponseEntity<?> updateProfile(@PathVariable String profileId,
                                           @RequestBody UpdateProfileRequest request) {
        try {
            return ResponseEntity.ok(profileService.updateInfoById(profileId, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Everybody waiting for organizer access. */
    @GetMapping("/organizer-requests")
    public List<MyProfileResponse> organizerRequests() {
        return profileService.getAllProfiles().stream()
                .filter(p -> "PENDING".equals(p.getOrganizerRequestStatus()))
                .toList();
    }

    @PostMapping("/organizer-requests/{profileId}/approve")
    public ResponseEntity<?> approveOrganizer(@PathVariable String profileId) {
        try {
            return ResponseEntity.ok(profileService.approveOrganizer(profileId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/organizer-requests/{profileId}/reject")
    public ResponseEntity<?> rejectOrganizer(@PathVariable String profileId) {
        try {
            return ResponseEntity.ok(profileService.rejectOrganizer(profileId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

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
