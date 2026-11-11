package com.CricLively.Service;

import com.CricLively.DTO.MatchAccessResponse;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Entities.Tournament;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * WHO MAY SCORE A MATCH (on top of "must be an organizer or admin"):
 *
 *   ADMIN ................................. every match
 *   main organizer (the one who made it) .. can score AND give / remove scoring access
 *   organizers of the match's tournament .. can score AND give / remove scoring access
 *   organizers the main organizer picked .. can score only
 *   everybody else ........................ cannot score
 *
 * Old matches made before this feature have no main organizer. A single match like that
 * belongs to the first organizer who starts scoring it.
 */
@Service
@RequiredArgsConstructor
public class MatchAccessService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;

    /** The person making the request, worked out once. */
    public static class Actor {
        final boolean admin;
        final boolean organizer; // organizer OR admin
        final String profileId;

        public String profileIdOrNull() {
            return profileId;
        }

        Actor(boolean admin, boolean organizer, String profileId) {
            this.admin = admin;
            this.organizer = organizer;
            this.profileId = profileId;
        }
    }

    public Actor actor(Authentication auth) {
        if (auth == null) return new Actor(false, false, null);
        boolean admin = hasRole(auth, "ADMIN");
        boolean organizer = admin || hasRole(auth, "ORGANIZER");
        String profileId = profileRepository.findByEmail(auth.getName()).map(Profile::getId).orElse(null);
        return new Actor(admin, organizer, profileId);
    }

    public boolean canManage(Actor a, Match m, Tournament t) {
        if (a.admin) return true;
        if (!a.organizer || a.profileId == null) return false;
        if (a.profileId.equals(m.getOwnerId())) return true;
        boolean tournamentOrganizer = t != null && t.getOrganizerIds() != null && t.getOrganizerIds().contains(a.profileId);
        if (tournamentOrganizer) return true;
        if (m.getOwnerId() == null) {
            // an old match nobody owns yet: a single match is open to any organizer (the first one to score it owns it);
            // a tournament match with no organizers listed is open too, so nobody is locked out
            return t == null || t.getOrganizerIds() == null || t.getOrganizerIds().isEmpty();
        }
        return false;
    }

    /** Who may extend a tournament: admin, the organizer who made it, or its listed organizers. */
    public boolean canExtendTournament(Actor a, Tournament t) {
        if (a.admin) return true;
        if (!a.organizer || a.profileId == null || t == null) return false;
        if (a.profileId.equals(t.getCreatedBy())) return true;
        if (t.getOrganizerIds() != null && t.getOrganizerIds().contains(a.profileId)) return true;
        // an old tournament nobody owns: any organizer may extend it, so nobody is locked out
        boolean noOrganizers = t.getOrganizerIds() == null || t.getOrganizerIds().isEmpty();
        return t.getCreatedBy() == null && noOrganizers;
    }

    /** "First Last" of a profile, or its email. */
    public String displayName(String profileId, Authentication auth) {
        if (profileId == null) return auth == null ? null : auth.getName();
        List<MatchAccessResponse.Person> p = people(Set.of(profileId));
        return p.isEmpty() ? (auth == null ? null : auth.getName()) : p.get(0).getName();
    }

    public boolean canScore(Actor a, Match m, Tournament t) {
        if (canManage(a, m, t)) return true;
        return a.organizer && a.profileId != null
                && m.getScorerIds() != null && m.getScorerIds().contains(a.profileId);
    }

    /** Called before every scoring change. Throws (403) when the person is not allowed. */
    public Match requireScorer(String matchId, Authentication auth) {
        Match match = find(matchId);
        Actor a = actor(auth);
        Tournament t = tournamentOf(match);
        if (!canScore(a, match, t)) {
            throw new AccessDeniedException(
                    "You do not have scoring access for this match. Ask its organizer to give you access.");
        }
        // an old single match: the organizer who starts scoring becomes its main organizer
        if (match.getOwnerId() == null && match.getTournamentId() == null && !a.admin && a.profileId != null) {
            match.setOwnerId(a.profileId);
            matchRepository.save(match);
        }
        return match;
    }

    public MatchAccessResponse info(String matchId, Authentication auth) {
        Match match = find(matchId);
        Actor a = actor(auth);
        Tournament t = tournamentOf(match);

        List<MatchAccessResponse.Person> scorers = people(match.getScorerIds());
        List<MatchAccessResponse.Person> tournamentOrganizers = t == null ? List.of() : people(organizerIdsOnly(t.getOrganizerIds()));
        String ownerName = null;
        if (match.getOwnerId() != null) {
            List<MatchAccessResponse.Person> owner = people(Set.of(match.getOwnerId()));
            ownerName = owner.isEmpty() ? null : owner.get(0).getName();
        }

        return MatchAccessResponse.builder()
                .canScore(canScore(a, match, t))
                .canManage(canManage(a, match, t))
                .ownerId(match.getOwnerId())
                .ownerName(ownerName)
                .scorers(scorers)
                .tournamentOrganizers(tournamentOrganizers)
                .build();
    }

    /** Replace the list of extra scorers. Only people who can manage this match may do it. */
    public MatchAccessResponse setScorers(String matchId, Collection<String> profileIds, Authentication auth) {
        Match match = find(matchId);
        Actor a = actor(auth);
        Tournament t = tournamentOf(match);
        if (!canManage(a, match, t)) {
            throw new AccessDeniedException("Only the main organizer of this match can change who may score it");
        }

        Set<String> clean = new LinkedHashSet<>();
        for (String id : profileIds == null ? List.<String>of() : profileIds) {
            if (id == null || id.isBlank() || id.equals(match.getOwnerId())) continue;
            Profile p = profileRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Person not found"));
            Set<Role> roles = p.getRole() == null ? Set.of() : p.getRole();
            if (!roles.contains(Role.ORGANIZER) && !roles.contains(Role.ADMIN)) {
                throw new IllegalArgumentException("Only organizers can be given scoring access");
            }
            clean.add(id);
        }
        match.setScorerIds(clean);
        matchRepository.save(match);
        return info(matchId, auth);
    }

    // ------------------------------------------------------------ helpers

    /** Keeps only the ids of people who really are organizers/admins right now. */
    private Set<String> organizerIdsOnly(Collection<String> profileIds) {
        Set<String> out = new LinkedHashSet<>();
        if (profileIds == null || profileIds.isEmpty()) return out;
        profileRepository.findAllById(profileIds).forEach(p -> {
            Set<Role> roles = p.getRole() == null ? Set.of() : p.getRole();
            if (roles.contains(Role.ORGANIZER) || roles.contains(Role.ADMIN)) out.add(p.getId());
        });
        return out;
    }

    private List<MatchAccessResponse.Person> people(Collection<String> profileIds) {
        if (profileIds == null || profileIds.isEmpty()) return List.of();
        Map<String, Profile> profiles = new LinkedHashMap<>();
        profileRepository.findAllById(profileIds).forEach(p -> profiles.put(p.getId(), p));

        Set<String> playerIds = new HashSet<>();
        profiles.values().forEach(p -> { if (p.getPlayerId() != null) playerIds.add(p.getPlayerId()); });
        Map<String, Player> players = new HashMap<>();
        playerRepository.findAllById(playerIds).forEach(p -> players.put(p.getId(), p));

        List<MatchAccessResponse.Person> out = new ArrayList<>();
        for (Profile p : profiles.values()) {
            Player pl = p.getPlayerId() == null ? null : players.get(p.getPlayerId());
            String name = pl == null ? p.getEmail()
                    : ((pl.getFirstName() == null ? "" : pl.getFirstName()) + " "
                    + (pl.getLastName() == null ? "" : pl.getLastName())).trim();
            out.add(new MatchAccessResponse.Person(p.getId(), name.isEmpty() ? p.getEmail() : name, p.getEmail()));
        }
        return out;
    }

    private Tournament tournamentOf(Match m) {
        return m.getTournamentId() == null ? null : tournamentRepository.findTournamentById(m.getTournamentId());
    }

    private Match find(String matchId) {
        return matchRepository.findById(matchId).orElseThrow(() -> new NoSuchElementException("Match not found"));
    }

    private static boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("ROLE_" + role));
    }
}
