package com.CricLively.Service;

import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Tournament;
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

    public List<MatchDashboardDTO> getAllMatches(String tournamentId){
        return matchRepository.findAll().stream()
                .map( match ->{
                    Tournament tournament = tournamentRepository.findTournamentById(tournamentId);
                    String teamAName =  teamRepository.findTeamNameById(match.getTeamAId());
                    String teamBName =  teamRepository.findTeamNameById(match.getTeamBId());
                    return convertToDashboardDTO(match, tournament, teamAName, teamBName);
                }).collect(Collectors.toList());
    }

    public MatchDashboardDTO convertToDashboardDTO(Match match, Tournament tournament, String teamAName, String teamBName) {
        MatchDashboardDTO.MatchDashboardDTOBuilder builder = MatchDashboardDTO.builder()
                .matchId(match.getId())
                .tournamentId(tournament.getId())
                .venue(tournament.getVenue())
                .date(match.getDate())
                .time(match.getTime())
                .teamAName(teamAName)
                .teamBName(teamBName)
                .matchStatus(match.getMatchStatus());

        if (match.getInnings1() != null) {
            builder.innings1(mapInnings(match.getInnings1(), teamAName, teamBName));
        }
        if (match.getInnings2() != null) {
            builder.innings2(mapInnings(match.getInnings2(), teamAName, teamBName));
        }

        return builder.build();
    }

    private MatchDashboardDTO.InningsSummaryDTO mapInnings(Innings innings, String teamAName, String teamBName) {
        if (innings == null) return null;

        // Logic to determine which team name to display based on battingTeamId
        String battingTeamName = innings.getBattingTeamId().equals(teamAName) ? teamAName : teamBName;

        return MatchDashboardDTO.InningsSummaryDTO.builder()
                .battingTeamName(battingTeamName)
                .runs(innings.getTotalRuns())
                .wickets(innings.getWicketsLost())
                .overs(innings.getOversCompleted())
                .isCompleted(innings.getIsCompleted())
                .build();
    }

}
