package com.CricLively.Service;

import com.CricLively.DTO.PointsTableRow;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Team;
import com.CricLively.Entities.Tournament;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Points table, worked out from the finished matches every time it is asked for,
 * so it is always up to date (win = 2, tie = 1, no result / abandoned = 1, loss = 0).
 * Teams with equal points are ordered by net run rate, then by wins.
 */
@Service
@RequiredArgsConstructor
public class StandingsService {

    private static final int WIN = 2, TIE = 1, NO_RESULT = 1;

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final MatchRepository matchRepository;
    private final MatchAccessService accessService;

    public List<PointsTableRow> pointsTable(String tournamentId, Authentication auth) {
        Tournament t = tournamentRepository.findTournamentById(tournamentId);
        if (t == null) throw new NoSuchElementException("Tournament not found");
        if (!accessService.canAccessTournament(accessService.actor(auth), t)) {
            throw new AccessDeniedException("Follow this tournament to see its points table");
        }

        Map<String, PointsTableRow> rows = new LinkedHashMap<>();
        for (Team team : teamRepository.findByTournamentId(tournamentId)) {
            rows.put(team.getId(), newRow(team.getId(), team.getTeamName(), team.getLogoImage()));
        }

        List<Match> matches = new ArrayList<>(matchRepository.findByTournamentId(tournamentId));
        matches.sort((x, y) -> {
            int c = compareNullsLast(x.getDate(), y.getDate());
            return c != 0 ? c : compareNullsLast(x.getTime(), y.getTime());
        });

        for (Match m : matches) {
            if (m.getMatchStatus() == MatchStatus.ABANDONED) {
                for (String id : List.of(m.getTeamAId(), m.getTeamBId())) {
                    PointsTableRow r = row(rows, id);
                    r.setPlayed(r.getPlayed() + 1);
                    r.setNoResult(r.getNoResult() + 1);
                    r.setPoints(r.getPoints() + NO_RESULT);
                    r.getForm().add("N");
                }
                continue;
            }
            if (!MatchResultUtil.isCompleted(m)) continue;

            // runs and balls for the net run rate
            for (Innings i : List.of(m.getInnings1(), m.getInnings2())) {
                PointsTableRow bat = row(rows, i.getBattingTeamId());
                PointsTableRow bowl = row(rows, i.getBowlingTeamId());
                int balls = MatchResultUtil.ballsForNrr(m, i);
                int runs = i.getTotalRuns();
                bat.setRunsFor(bat.getRunsFor() + runs);
                bat.setBallsFor(bat.getBallsFor() + balls);
                bowl.setRunsAgainst(bowl.getRunsAgainst() + runs);
                bowl.setBallsAgainst(bowl.getBallsAgainst() + balls);
            }

            String winner = MatchResultUtil.winnerTeamId(m);
            for (String id : List.of(m.getTeamAId(), m.getTeamBId())) {
                PointsTableRow r = row(rows, id);
                r.setPlayed(r.getPlayed() + 1);
                if (winner == null) {
                    r.setTied(r.getTied() + 1);
                    r.setPoints(r.getPoints() + TIE);
                    r.getForm().add("T");
                } else if (winner.equals(id)) {
                    r.setWon(r.getWon() + 1);
                    r.setPoints(r.getPoints() + WIN);
                    r.getForm().add("W");
                } else {
                    r.setLost(r.getLost() + 1);
                    r.getForm().add("L");
                }
            }
        }

        List<PointsTableRow> out = new ArrayList<>(rows.values());
        for (PointsTableRow r : out) {
            double scored = r.getBallsFor() == 0 ? 0 : r.getRunsFor() / (r.getBallsFor() / 6.0);
            double conceded = r.getBallsAgainst() == 0 ? 0 : r.getRunsAgainst() / (r.getBallsAgainst() / 6.0);
            r.setNrr(Math.round((scored - conceded) * 1000.0) / 1000.0);
            List<String> form = r.getForm();
            if (form.size() > 5) r.setForm(new ArrayList<>(form.subList(form.size() - 5, form.size())));
        }
        out.sort((x, y) -> {
            if (x.getPoints() != y.getPoints()) return Integer.compare(y.getPoints(), x.getPoints());
            if (x.getNrr() != y.getNrr()) return Double.compare(y.getNrr(), x.getNrr());
            if (x.getWon() != y.getWon()) return Integer.compare(y.getWon(), x.getWon());
            String nx = x.getTeamName() == null ? "" : x.getTeamName();
            String ny = y.getTeamName() == null ? "" : y.getTeamName();
            return nx.compareToIgnoreCase(ny);
        });
        for (int i = 0; i < out.size(); i++) out.get(i).setPosition(i + 1);
        return out;
    }

    private static <T extends Comparable<? super T>> int compareNullsLast(T a, T b) {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        return a.compareTo(b);
    }

    private PointsTableRow row(Map<String, PointsTableRow> rows, String teamId) {
        return rows.computeIfAbsent(teamId, id -> {
            Team team = teamRepository.findById(id).orElse(null);
            return newRow(id, team == null ? "Team" : team.getTeamName(), team == null ? null : team.getLogoImage());
        });
    }

    private static PointsTableRow newRow(String id, String name, String logo) {
        PointsTableRow r = new PointsTableRow();
        r.setTeamId(id);
        r.setTeamName(name);
        r.setLogoImage(logo);
        return r;
    }
}
