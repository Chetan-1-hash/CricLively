package com.CricLively.Security;

import com.CricLively.Repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * "Is this person allowed to touch this player record?"
 * Yes if it is their OWN player record, or if they are an ADMIN.
 */
@Component
@RequiredArgsConstructor
public class PlayerAccess {

    private final ProfileRepository profileRepository;

    public boolean canAccessPlayer(String playerId, Authentication authentication) {
        if (authentication == null || playerId == null) {
            return false;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return true;
        }

        return profileRepository.findByEmail(authentication.getName())
                .map(profile -> playerId.equals(profile.getPlayerId()))
                .orElse(false);
    }
}
