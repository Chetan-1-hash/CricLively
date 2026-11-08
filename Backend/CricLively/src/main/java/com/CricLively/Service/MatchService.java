package com.CricLively.Service;

import com.CricLively.DTO.AddMatchDTO;
import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.*;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;

    public List<MatchDashboardDTO> getAllMatches() {
        return tournamentRepository.findAll()
                .stream()
                .flatMap(tournament ->
                        matchRepository.findByTournamentId(tournament.getId())
                                .stream()
                                .map(match -> {
                                    Team teamA = teamRepository.findTeamNameById(match.getTeamAId());
                                    Team teamB = teamRepository.findTeamNameById(match.getTeamBId());

                                    return convertToDashboardDTO(match, tournament, teamA, teamB);
                                })
                )
                .collect(Collectors.toList());
    }

    public List<MatchDashboardDTO> getTournamentMatches(String tournamentId) {

        Tournament tournament = tournamentRepository.findTournamentById(tournamentId);
        if (tournament == null) {
            return List.of();
        }

        return matchRepository.findByTournamentId(tournamentId)
                .stream()
                .map(match -> {
                    Team teamA = teamRepository.findTeamNameById(match.getTeamAId());
                    Team teamB = teamRepository.findTeamNameById(match.getTeamBId());

                    return convertToDashboardDTO(match, tournament, teamA, teamB);
                })
                .collect(Collectors.toList());
    }

    public MatchDashboardDTO convertToDashboardDTO(Match match, Tournament tournament, Team teamA, Team teamB) {
        String teamAName = teamA != null ? teamA.getTeamName() : "Unknown team";
        String teamBName = teamB != null ? teamB.getTeamName() : "Unknown team";
        MatchDashboardDTO.MatchDashboardDTOBuilder builder = MatchDashboardDTO.builder()
                .matchId(match.getId())
                .tournamentId(tournament.getId())
                .venue(tournament.getVenue())
                .date(match.getDate())
                .time(match.getTime())
                .teamAName(teamAName)
                .teamBName(teamBName)
                .matchStatus(match.getMatchStatus());
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

    public void addMatch(AddMatchDTO addmatchdto) {
        Match match = new Match();

//        match.setId(addmatchdto.getMatchId());
        match.setTournamentId(addmatchdto.getTournamentId());
        match.setTeamAId(addmatchdto.getTeamAId());
        match.setTeamBId(addmatchdto.getTeamBId());
        match.setDate(addmatchdto.getDate());
        match.setTime(addmatchdto.getTime());
        match.setOversPerInnings(addmatchdto.getOversPerInnings());
        match.setMatchType(addmatchdto.getMatchType());
        match.setMatchStatus(MatchStatus.UPCOMING);

        // initial state
        match.setToss(null);
        match.setInnings1(null);
        match.setInnings2(null);

        matchRepository.save(match);
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

    private Match getMatch(String matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
    }

}
