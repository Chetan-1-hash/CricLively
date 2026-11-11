package com.CricLively.Service;

import com.CricLively.DTO.AddMatchDTO;
import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.*;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Enums.MatchType;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import com.CricLively.Websocket.LiveScoreHandler;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchAccessService accessService;
    private final ProfileRepository profileRepository;
    private final LiveScoreHandler liveScores;

    /** Every match - tournament matches AND single (tournament-less) matches. */
    public List<MatchDashboardDTO> getAllMatches(Authentication auth) {
        MatchAccessService.Actor actor = accessService.actor(auth);
        Map<String, Tournament> tournaments = tournamentRepository.findAll().stream()
                .collect(Collectors.toMap(Tournament::getId, t -> t, (a, b) -> a));

        return matchRepository.findAll().stream()
                .map(match -> {
                    Tournament tournament = match.getTournamentId() == null
                            ? null
                            : tournaments.get(match.getTournamentId());
                    Team teamA = teamRepository.findTeamNameById(match.getTeamAId());
                    Team teamB = teamRepository.findTeamNameById(match.getTeamBId());
                    return convertToDashboardDTO(match, tournament, teamA, teamB, actor);
                })
                .collect(Collectors.toList());
    }

    public List<MatchDashboardDTO> getTournamentMatches(String tournamentId, Authentication auth) {
        MatchAccessService.Actor actor = accessService.actor(auth);

        Tournament tournament = tournamentRepository.findTournamentById(tournamentId);
        if (tournament == null) {
            return List.of();
        }

        return matchRepository.findByTournamentId(tournamentId)
                .stream()
                .map(match -> {
                    Team teamA = teamRepository.findTeamNameById(match.getTeamAId());
                    Team teamB = teamRepository.findTeamNameById(match.getTeamBId());

                    return convertToDashboardDTO(match, tournament, teamA, teamB, actor);
                })
                .collect(Collectors.toList());
    }

    public MatchDashboardDTO convertToDashboardDTO(Match match, Tournament tournament, Team teamA, Team teamB,
                                                   MatchAccessService.Actor actor) {
        String teamAName = teamA != null ? teamA.getTeamName() : "Unknown team";
        String teamBName = teamB != null ? teamB.getTeamName() : "Unknown team";
        System.out.println(match.getDate() + " " + match.getTime());
        MatchDashboardDTO.MatchDashboardDTOBuilder builder = MatchDashboardDTO.builder()
                .matchId(match.getId())
                .tournamentId(tournament != null ? tournament.getId() : null) // null = single match
                .venue(match.getVenue() != null && !match.getVenue().isBlank()
                        ? match.getVenue()
                        : (tournament != null ? tournament.getVenue() : null))
                .date(match.getDate())
                .time(match.getTime())
                .teamAName(teamAName)
                .teamBName(teamBName)
                .matchStatus(match.getMatchStatus())
                .canScore(accessService.canScore(actor, match, tournament))
                .canManage(accessService.canManage(actor, match, tournament));
        if (match.getInnings1() != null && match.getMatchStatus() != MatchStatus.UPCOMING) {
            builder.innings1(mapInnings(match.getInnings1(), match.getTeamAId(), teamAName, teamBName));
        }
        if (match.getInnings2() != null && match.getMatchStatus() != MatchStatus.UPCOMING) {
            builder.innings2(mapInnings(match.getInnings2(), match.getTeamAId(), teamAName, teamBName));
        }

        return builder.build();
    }

    private MatchDashboardDTO.InningsSummaryDTO mapInnings(Innings innings, String teamAId, String teamAName, String teamBName) {
        if (innings == null) return null;

        // Logic to determine which team name to display based on battingTeamId
        String battingTeamName = innings.getBattingTeamId().equals(teamAId) ? teamAName : teamBName;

        return MatchDashboardDTO.InningsSummaryDTO.builder()
                .battingTeamName(battingTeamName)
                .runs(innings.getTotalRuns())
                .wickets(innings.getWicketsLost())
                .overs(innings.getOversCompleted())
                .isCompleted(innings.getIsCompleted())
                .build();
    }

    public void addMatch(AddMatchDTO dto, String creatorEmail) {
        // tournament is OPTIONAL
        String tournamentId = dto.getTournamentId() == null || dto.getTournamentId().isBlank()
                ? null : dto.getTournamentId().trim();
        Tournament tournament = null;
        if (tournamentId != null) {
            tournament = tournamentRepository.findTournamentById(tournamentId);
            if (tournament == null) throw new IllegalArgumentException("Tournament not found");
        }

        if (isBlank(dto.getTeamAId()) || isBlank(dto.getTeamBId())) {
            throw new IllegalArgumentException("Select both teams");
        }
        if (dto.getTeamAId().equals(dto.getTeamBId())) {
            throw new IllegalArgumentException("Team 1 and Team 2 must be different");
        }
        Team teamA = teamRepository.findById(dto.getTeamAId())
                .orElseThrow(() -> new IllegalArgumentException("Team 1 not found"));
        Team teamB = teamRepository.findById(dto.getTeamBId())
                .orElseThrow(() -> new IllegalArgumentException("Team 2 not found"));
        if (tournamentId != null
                && (!tournamentId.equals(teamA.getTournamentId()) || !tournamentId.equals(teamB.getTournamentId()))) {
            throw new IllegalArgumentException("Both teams must belong to the selected tournament");
        }

        if (dto.getDate() == null) throw new IllegalArgumentException("Match date is required");

        Integer overs = dto.getOversPerInnings();
        if (overs == null || overs < 1 || overs > 50) {
            throw new IllegalArgumentException("Overs per innings must be between 1 and 50");
        }

        String venue = isBlank(dto.getVenue()) ? null : dto.getVenue().trim();
        if (venue == null && tournament != null) venue = tournament.getVenue();
        if (venue == null) throw new IllegalArgumentException("Venue is required");

        Match match = new Match();
        match.setTournamentId(tournamentId);
        // the organizer who creates the match is its main organizer
        match.setOwnerId(creatorEmail == null ? null
                : profileRepository.findByEmail(creatorEmail).map(Profile::getId).orElse(null));
        match.setVenue(venue);
        match.setTeamAId(dto.getTeamAId());
        match.setTeamBId(dto.getTeamBId());
        match.setDate(dto.getDate());
        match.setTime(dto.getTime());
        match.setOversPerInnings(overs);
        match.setMatchType(dto.getMatchType() != null ? dto.getMatchType() : MatchType.FRIENDLY);
        match.setMatchStatus(MatchStatus.UPCOMING);

        // initial state
        match.setToss(null);
        match.setInnings1(null);
        match.setInnings2(null);

        matchRepository.save(match);
        liveScores.publishAll(); // match lists show the new match without a refresh
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    // START MATCH (LIVE)
    public Match startMatch(String matchId, Toss toss) {
        Match match = getMatch(matchId);
        match.setToss(toss);
        match.setMatchStatus(MatchStatus.LIVE);
        return matchRepository.save(match);
    }

    // START INNINGS 1
    public Match startInnings1(String matchId, Innings innings1) {
        Match match = getMatch(matchId);
        match.setInnings1(innings1);
        match.setMatchStatus(MatchStatus.LIVE);
        return matchRepository.save(match);
    }

    // START INNINGS 2
    public Match startInnings2(String matchId, Innings innings2) {
        Match match = getMatch(matchId);
        match.setInnings2(innings2);
        match.setMatchStatus(MatchStatus.LIVE);
        return matchRepository.save(match);
    }

    // FINISH MATCH
    public Match finishMatch(String matchId) {
        Match match = getMatch(matchId);
        match.setMatchStatus(MatchStatus.FINISHED);
        return matchRepository.save(match);
    }

    //ABANDON MATCH
    public Match abandonMatch(String matchId) {
        Match match = getMatch(matchId);
        match.setMatchStatus(MatchStatus.ABANDONED);
        return matchRepository.save(match);
    }

    /** Read one match (used by the scoreboard and by the scorer's safety checks). */
    public Match getScoreboard(String matchId) {
        return getMatch(matchId);
    }

    private Match getMatch(String matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new NoSuchElementException("Match not found"));
    }

}
