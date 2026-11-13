package com.CricLively;

import com.CricLively.DTO.AddPlayerProfileRequest;
import com.CricLively.DTO.ProfileList;
import com.CricLively.DTO.ScoreboardResponse;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Entities.Team;
import com.CricLively.Entities.Toss;
import com.CricLively.Repository.BallByBallRepository;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Repository.TournamentRepository;
import com.CricLively.Service.EmailVerificationService;
import com.CricLively.Service.PlayerEligibilityService;
import com.CricLively.Service.PlayerService;
import com.CricLively.Service.ProfileService;
import com.CricLively.Service.ScoringService;
import com.CricLively.Service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class VerificationAndEligibilityTests {

    private Map<String, Profile> profileStore;
    private Map<String, Player> playerStore;
    private Map<String, Team> teamStore;
    private Map<String, Match> matchStore;

    private EmailVerificationService emailVerificationService;
    private String lastEmailedCode;
    private TeamService teamService;
    private ScoringService scoringService;
    private ProfileService profileService;

    @SuppressWarnings("unchecked")
    private static <T> T repoProxy(Class<T> iface, java.util.function.BiFunction<String, Object[], Object> handler) {
        return (T) Proxy.newProxyInstance(
                iface.getClassLoader(),
                new Class<?>[]{iface},
                (proxy, method, args) -> handler.apply(method.getName(), args == null ? new Object[0] : args)
        );
    }

    @BeforeEach
    void setUp() {
        profileStore = new LinkedHashMap<>();
        playerStore = new LinkedHashMap<>();
        teamStore = new LinkedHashMap<>();
        matchStore = new LinkedHashMap<>();

        ProfileRepository profileRepo = repoProxy(ProfileRepository.class, (name, args) -> {
            switch (name) {
                case "save": {
                    Profile p = (Profile) args[0];
                    if (p.getId() == null) p.setId("prof-" + (profileStore.size() + 1));
                    profileStore.put(p.getId(), p);
                    return p;
                }
                case "findById":
                    return Optional.ofNullable(profileStore.get((String) args[0]));
                case "findByEmail": {
                    String em = (String) args[0];
                    return profileStore.values().stream().filter(p -> Objects.equals(p.getEmail(), em)).findFirst();
                }
                case "findByEmailIgnoreCase": {
                    String em = (String) args[0];
                    return profileStore.values().stream()
                            .filter(p -> p.getEmail() != null && p.getEmail().equalsIgnoreCase(em))
                            .findFirst();
                }
                case "existsByEmail": {
                    String em = (String) args[0];
                    return profileStore.values().stream().anyMatch(p -> Objects.equals(p.getEmail(), em));
                }
                case "existsByEmailIgnoreCase": {
                    String em = (String) args[0];
                    return profileStore.values().stream()
                            .anyMatch(p -> p.getEmail() != null && p.getEmail().equalsIgnoreCase(em));
                }
                case "findByMobileNumber": {
                    String mob = (String) args[0];
                    return profileStore.values().stream().filter(p -> Objects.equals(p.getMobileNumber(), mob)).findFirst();
                }
                case "findAll":
                    return new ArrayList<>(profileStore.values());
                case "findAllById": {
                    Iterable<String> ids = (Iterable<String>) args[0];
                    List<Profile> out = new ArrayList<>();
                    for (String id : ids) {
                        Profile p = profileStore.get(id);
                        if (p != null) out.add(p);
                    }
                    return out;
                }
                default:
                    throw new UnsupportedOperationException("ProfileRepository." + name);
            }
        });

        PlayerRepository playerRepo = repoProxy(PlayerRepository.class, (name, args) -> {
            switch (name) {
                case "save": {
                    Player pl = (Player) args[0];
                    if (pl.getId() == null) pl.setId("pl-" + (playerStore.size() + 1));
                    playerStore.put(pl.getId(), pl);
                    return pl;
                }
                case "findById":
                    return Optional.ofNullable(playerStore.get((String) args[0]));
                case "findAllById": {
                    Iterable<String> ids = (Iterable<String>) args[0];
                    List<Player> out = new ArrayList<>();
                    for (String id : ids) {
                        Player pl = playerStore.get(id);
                        if (pl != null) out.add(pl);
                    }
                    return out;
                }
                default:
                    throw new UnsupportedOperationException("PlayerRepository." + name);
            }
        });

        TeamRepository teamRepo = repoProxy(TeamRepository.class, (name, args) -> {
            switch (name) {
                case "save": {
                    Team t = (Team) args[0];
                    if (t.getId() == null) t.setId("team-" + (teamStore.size() + 1));
                    teamStore.put(t.getId(), t);
                    return t;
                }
                case "findById":
                    return Optional.ofNullable(teamStore.get((String) args[0]));
                case "existsByTournamentIdAndSquadPlayerIdsContaining": {
                    String tid = (String) args[0];
                    String pid = (String) args[1];
                    return teamStore.values().stream().anyMatch(t ->
                            Objects.equals(t.getTournamentId(), tid)
                                    && t.getSquadPlayerIds() != null
                                    && t.getSquadPlayerIds().contains(pid));
                }
                default:
                    throw new UnsupportedOperationException("TeamRepository." + name);
            }
        });

        MatchRepository matchRepo = repoProxy(MatchRepository.class, (name, args) -> {
            switch (name) {
                case "save": {
                    Match m = (Match) args[0];
                    if (m.getId() == null) m.setId("m-" + (matchStore.size() + 1));
                    matchStore.put(m.getId(), m);
                    return m;
                }
                case "findById":
                    return Optional.ofNullable(matchStore.get((String) args[0]));
                case "findAll":
                    return new ArrayList<>(matchStore.values());
                default:
                    throw new UnsupportedOperationException("MatchRepository." + name);
            }
        });

        BallByBallRepository ballRepo = repoProxy(BallByBallRepository.class, (name, args) -> {
            if ("findByMatchIdAndInningsNoOrderBySeqAsc".equals(name)) return List.of();
            throw new UnsupportedOperationException("BallByBallRepository." + name);
        });

        TournamentRepository tournamentRepo = repoProxy(TournamentRepository.class, (name, args) -> {
            if ("findTournamentById".equals(name)) return null;
            throw new UnsupportedOperationException("TournamentRepository." + name);
        });

        PlayerEligibilityService eligibilityService =
                new PlayerEligibilityService(matchRepo, profileRepo, playerRepo);

        lastEmailedCode = null;
        emailVerificationService = new EmailVerificationService(profileRepo) {
            @Override
            protected void sendSmtpEmail(String toEmail, String code, String verifyLink) {
                lastEmailedCode = code;
            }
        };
        ReflectionTestUtils.setField(emailVerificationService, "mailHost", "smtp.example.com");
        ReflectionTestUtils.setField(emailVerificationService, "smtpAuth", false);
        ReflectionTestUtils.setField(emailVerificationService, "ttlMinutes", 15);
        ReflectionTestUtils.setField(emailVerificationService, "frontendUrl", "http://localhost:5173");

        teamService = new TeamService(teamRepo, eligibilityService);
        scoringService = new ScoringService(
                matchRepo, ballRepo, teamRepo, playerRepo, profileRepo, tournamentRepo, eligibilityService);
        PlayerService playerService = new PlayerService(playerRepo, null);
        profileService = new ProfileService(profileRepo, playerRepo, playerService, eligibilityService);
    }

    private void seedPlayer(String id, String firstName, String email, boolean verified) {
        Player pl = new Player();
        pl.setId("pl-" + id);
        pl.setFirstName(firstName);
        pl.setLastName("Player");
        playerStore.put(pl.getId(), pl);

        Profile pr = new Profile();
        pr.setId(id);
        pr.setEmail(email);
        pr.setMobileNumber("999000" + id);
        pr.setPassword("pass");
        pr.setRole(Set.of(Role.PLAYER));
        pr.setPlayerId(pl.getId());
        pr.setEmailVerified(verified);
        profileStore.put(id, pr);
    }

    @Test
    void emailVerificationSendsEmailAndVerifiesCodeWithoutExposingDevCode() {
        seedPlayer("p1", "Alice", "alice@example.com", false);

        Map<String, Object> sent = emailVerificationService.sendVerification("alice@example.com");
        assertEquals(false, sent.get("alreadyVerified"));
        assertEquals(true, sent.get("sentViaSmtp"));
        assertNull(sent.get("devCode"));
        assertNotNull(lastEmailedCode);
        assertEquals(6, lastEmailedCode.length());

        assertThrows(IllegalArgumentException.class,
                () -> emailVerificationService.verifyEmail("alice@example.com", "000000"));

        Profile verified = emailVerificationService.verifyEmail("alice@example.com", lastEmailedCode);
        assertTrue(verified.isEmailVerified());
        assertNull(verified.getEmailVerificationCode());
    }

    @Test
    void expiredVerificationCodeIsRejected() {
        seedPlayer("p1", "Bob", "bob@example.com", false);
        Profile p = profileStore.get("p1");
        p.setEmailVerificationCode("123456");
        p.setEmailVerificationExpiresAt(LocalDateTime.now().minusMinutes(1));

        assertThrows(IllegalArgumentException.class,
                () -> emailVerificationService.verifyEmail("bob@example.com", "123456"));
    }

    @Test
    void unverifiedPlayerAllowedFirstMatchBlockedFromSecondTeamAndMatchUntilVerified() {
        seedPlayer("p1", "Unverified", "u1@example.com", false);
        seedPlayer("p2", "Verified2", "v2@example.com", true);
        seedPlayer("p3", "Verified3", "v3@example.com", true);
        seedPlayer("p4", "Verified4", "v4@example.com", true);

        // 0 matches played: unverified player p1 CAN join a team
        Team teamA = new Team();
        teamA.setId("teamA");
        teamA.setTournamentId("t1");
        teamA.setTeamName("Lions");
        teamA.setCaptainId("p1");
        teamA.setSquadPlayerIds(List.of("p1", "p2"));
        assertDoesNotThrow(() -> teamService.createTeam(teamA));

        Team teamB = new Team();
        teamB.setId("teamB");
        teamB.setTournamentId("t1");
        teamB.setTeamName("Eagles");
        teamB.setCaptainId("p3");
        teamB.setSquadPlayerIds(List.of("p3", "p4"));
        assertDoesNotThrow(() -> teamService.createTeam(teamB));

        // p1 plays Match 1 (FINISHED)
        Match m1 = new Match();
        m1.setId("m1");
        m1.setTeamAId("teamA");
        m1.setTeamBId("teamB");
        m1.setMatchStatus(MatchStatus.FINISHED);
        m1.setPlayingXiA(List.of("p1", "p2"));
        m1.setPlayingXiB(List.of("p3", "p4"));
        matchStore.put("m1", m1);

        // Now p1 is blocked from joining another team
        Team newTeam = new Team();
        newTeam.setTournamentId("t2");
        newTeam.setTeamName("Tigers");
        newTeam.setSquadPlayerIds(List.of("p1", "p2"));
        IllegalArgumentException teamEx = assertThrows(IllegalArgumentException.class,
                () -> teamService.createTeam(newTeam));
        assertTrue(teamEx.getMessage().contains("already played 1 match"));

        // Match 2 starts UPCOMING
        Match m2 = new Match();
        m2.setId("m2");
        m2.setTeamAId("teamA");
        m2.setTeamBId("teamB");
        m2.setMatchStatus(MatchStatus.UPCOMING);
        matchStore.put("m2", m2);

        Toss toss = new Toss();
        toss.setWinnerId("teamA");
        toss.setDecision(Toss.Decision.BATTING);

        // TeamA only has 1 eligible player (p2), so m2 cannot start
        IllegalStateException startEx = assertThrows(IllegalStateException.class,
                () -> scoringService.startMatch("m2", toss));
        assertTrue(startEx.getMessage().contains("needs at least 2 verified or eligible players"));

        // Scoreboard includes verification and match count metadata
        ScoreboardResponse sb = scoringService.getScoreboard("m2");
        assertEquals(false, sb.getPlayerVerified().get("p1"));
        assertEquals(true, sb.getPlayerVerified().get("p2"));
        assertEquals(1, sb.getPlayerMatchesPlayed().get("p1"));

        // If m2 is LIVE (e.g., teamA had a 3rd player), p1 still cannot be placed in lineup
        m2.setMatchStatus(MatchStatus.LIVE);
        m2.setToss(toss);
        IllegalArgumentException lineupEx = assertThrows(IllegalArgumentException.class,
                () -> scoringService.setLineup("m2", List.of("p1", "p2"), List.of("p3", "p4")));
        assertTrue(lineupEx.getMessage().contains("already played 1 match"));

        // Once p1 verifies email, p1 CAN join teams and play m2
        profileStore.get("p1").setEmailVerified(true);
        assertDoesNotThrow(() -> teamService.createTeam(newTeam));
        m2.setMatchStatus(MatchStatus.UPCOMING);
        m2.setToss(null);
        assertDoesNotThrow(() -> scoringService.startMatch("m2", toss));
        assertDoesNotThrow(() -> scoringService.setLineup("m2", List.of("p1", "p2"), List.of("p3", "p4")));
    }

    @Test
    void staffCanCreatePlayerAndProfile() throws Exception {
        AddPlayerProfileRequest req = new AddPlayerProfileRequest();
        req.setFirstName("Rohit");
        req.setLastName("Sharma");
        req.setEmail("rohit@example.com");
        req.setMobileNumber("9876543210");

        ProfileList created = profileService.createPlayerProfileByStaff(req);
        assertNotNull(created.getId());
        assertEquals("rohit@example.com", created.getEmail());
        assertEquals("Rohit", created.getFirstName());
        assertFalse(created.isEmailVerified());
        assertEquals(0, created.getMatchesPlayed());
        assertEquals(1, profileStore.size());
        assertEquals(1, playerStore.size());
    }
}
