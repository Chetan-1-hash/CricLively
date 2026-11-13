package com.CricLively.Service;

import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Enforces the 1-match limit for players whose email is not yet verified.
 * A match counts as played once it starts (LIVE or FINISHED) and the player
 * is in playingXiA or playingXiB.
 */
@Service
@RequiredArgsConstructor
public class PlayerEligibilityService {

    public static final int MAX_UNVERIFIED_MATCHES = 1;

    private final MatchRepository matchRepository;
    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;

    /** Returns profileId -> number of LIVE/FINISHED matches played (excluding excludeMatchId). */
    public Map<String, Integer> matchesPlayedMap(String excludeMatchId) {
        Map<String, Integer> counts = new HashMap<>();
        for (Match m : matchRepository.findAll()) {
            if (excludeMatchId != null && excludeMatchId.equals(m.getId())) continue;
            if (m.getMatchStatus() != MatchStatus.LIVE && m.getMatchStatus() != MatchStatus.FINISHED) continue;

            Set<String> inMatch = new HashSet<>();
            if (m.getPlayingXiA() != null) inMatch.addAll(m.getPlayingXiA());
            if (m.getPlayingXiB() != null) inMatch.addAll(m.getPlayingXiB());
            for (String pid : inMatch) {
                if (pid != null && !pid.isBlank()) {
                    counts.merge(pid, 1, Integer::sum);
                }
            }
        }
        return counts;
    }

    public int countMatchesPlayed(String profileId, String excludeMatchId) {
        if (profileId == null || profileId.isBlank()) return 0;
        return matchesPlayedMap(excludeMatchId).getOrDefault(profileId, 0);
    }

    public boolean isEligibleToPlay(Profile profile, int otherMatchesPlayed) {
        if (profile == null) return false;
        return profile.isEmailVerified() || otherMatchesPlayed < MAX_UNVERIFIED_MATCHES;
    }

    /** Throws IllegalArgumentException if any player already used their 1 free match without verifying email. */
    public void requireEligibleToPlay(Collection<String> profileIds, String excludeMatchId, String actionLabel) {
        if (profileIds == null || profileIds.isEmpty()) return;

        Set<String> clean = new LinkedHashSet<>();
        for (String id : profileIds) {
            if (id != null && !id.isBlank()) clean.add(id);
        }
        if (clean.isEmpty()) return;

        Map<String, Integer> playedMap = matchesPlayedMap(excludeMatchId);
        Map<String, Profile> profiles = new HashMap<>();
        profileRepository.findAllById(clean).forEach(p -> profiles.put(p.getId(), p));

        List<String> blockedNames = new ArrayList<>();
        Set<String> playerIds = new HashSet<>();
        for (String id : clean) {
            Profile p = profiles.get(id);
            if (p != null && !isEligibleToPlay(p, playedMap.getOrDefault(id, 0))) {
                if (p.getPlayerId() != null) playerIds.add(p.getPlayerId());
            }
        }
        if (playerIds.isEmpty() && profiles.values().stream()
                .allMatch(p -> isEligibleToPlay(p, playedMap.getOrDefault(p.getId(), 0)))) {
            return;
        }

        Map<String, Player> players = new HashMap<>();
        if (!playerIds.isEmpty()) {
            playerRepository.findAllById(playerIds).forEach(pl -> players.put(pl.getId(), pl));
        }

        for (String id : clean) {
            Profile p = profiles.get(id);
            if (p != null && !isEligibleToPlay(p, playedMap.getOrDefault(id, 0))) {
                Player pl = p.getPlayerId() == null ? null : players.get(p.getPlayerId());
                blockedNames.add(displayName(p, pl));
            }
        }

        if (!blockedNames.isEmpty()) {
            throw new IllegalArgumentException(
                    String.join(", ", blockedNames)
                            + (blockedNames.size() == 1 ? " has" : " have")
                            + " already played 1 match without email verification and cannot "
                            + actionLabel + " until email is verified."
            );
        }
    }

    /** Returns the subset of squadIds who are currently allowed to play a match. */
    public List<String> eligibleFromSquad(Collection<String> squadIds, String excludeMatchId) {
        if (squadIds == null || squadIds.isEmpty()) return List.of();
        Map<String, Integer> playedMap = matchesPlayedMap(excludeMatchId);
        Map<String, Profile> profiles = new HashMap<>();
        profileRepository.findAllById(squadIds).forEach(p -> profiles.put(p.getId(), p));

        List<String> eligible = new ArrayList<>();
        for (String id : squadIds) {
            Profile p = profiles.get(id);
            if (p == null || isEligibleToPlay(p, playedMap.getOrDefault(id, 0))) {
                eligible.add(id);
            }
        }
        return eligible;
    }

    public static String displayName(Profile p, Player pl) {
        if (pl != null) {
            String full = ((pl.getFirstName() == null ? "" : pl.getFirstName()) + " "
                    + (pl.getLastName() == null ? "" : pl.getLastName())).trim();
            if (!full.isEmpty()) return full;
        }
        return p != null && p.getEmail() != null ? p.getEmail() : "Player";
    }
}

