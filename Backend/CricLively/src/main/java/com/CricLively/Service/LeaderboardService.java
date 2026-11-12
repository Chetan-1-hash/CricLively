package com.CricLively.Service;

import com.CricLively.DTO.LeaderboardResponse;
import com.CricLively.DTO.LeaderboardResponse.PlayerRow;
import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Entities.Team;
import com.CricLively.Entities.Tournament;
import com.CricLively.Entities.Wicket;
import com.CricLively.Repository.BallByBallRepository;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Batting, bowling, fielding and MVP numbers of every player for ONE tournament.
 * Only completed matches count (finished, or both innings over), so the table changes the moment a match ends.
 */
@Service
@RequiredArgsConstructor
public class LeaderboardService {

    // MVP points (one place to change them)
    static final int RUN = 1, FOUR_BONUS = 1, SIX_BONUS = 2, FIFTY_BONUS = 10, HUNDRED_BONUS = 25, DUCK = -5;
    static final int WICKET = 25, DOT_BALL = 1, THREE_WICKETS = 10, FIVE_WICKETS = 25;
    static final int CATCH = 10, STUMPING = 10, RUN_OUT = 10, RUN_OUT_ASSIST = 5;

    private final TournamentRepository tournamentRepository;
    private final MatchRepository matchRepository;
    private final BallByBallRepository ballRepository;
    private final TeamRepository teamRepository;
    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;
    private final MatchAccessService accessService;

    private static class Agg {
        String id, team;
        int matches;
        int batInnings, runs, balls, fours, sixes, outs, highest, fifties, hundreds, ducks;
        int bowlInnings, legalBalls, conceded, wickets, dots, bestW = -1, bestR, threeW, fiveW;
        int catches, stumpings, runOuts, assists;
    }

    public LeaderboardResponse leaderboard(String tournamentId, Authentication auth) {
        Tournament t = tournamentRepository.findTournamentById(tournamentId);
        if (t == null) throw new NoSuchElementException("Tournament not found");
        if (!accessService.canAccessTournament(accessService.actor(auth), t)) {
            throw new AccessDeniedException("Follow this tournament to see its leaderboard");
        }

        Map<String, String> teamNames = new HashMap<>();
        for (Team team : teamRepository.findByTournamentId(tournamentId)) teamNames.put(team.getId(), team.getTeamName());

        Map<String, Agg> all = new LinkedHashMap<>();
        for (Match m : matchRepository.findByTournamentId(tournamentId)) {
            if (!MatchResultUtil.isCompleted(m)) continue;
            addXi(all, m.getPlayingXiA(), teamNames.get(m.getTeamAId()));
            addXi(all, m.getPlayingXiB(), teamNames.get(m.getTeamBId()));
            for (int no = 1; no <= 2; no++) {
                addInnings(all, ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(m.getId(), no));
            }
        }

        Map<String, String> names = namesOf(all.keySet());
        LeaderboardResponse out = new LeaderboardResponse();
        for (Agg a : all.values()) out.getPlayers().add(toRow(a, names.getOrDefault(a.id, "Player")));
        out.getMvpRules().addAll(List.of(
                "Batting: " + RUN + " per run, +" + FOUR_BONUS + " per four, +" + SIX_BONUS + " per six, +" + FIFTY_BONUS
                        + " for a fifty, +" + HUNDRED_BONUS + " for a hundred, " + DUCK + " for a duck",
                "Bowling: " + WICKET + " per wicket, " + DOT_BALL + " per dot ball, +" + THREE_WICKETS
                        + " for 3-4 wickets in an innings, +" + FIVE_WICKETS + " for 5 or more",
                "Fielding: " + CATCH + " per catch, " + STUMPING + " per stumping, " + RUN_OUT + " per run-out, +"
                        + RUN_OUT_ASSIST + " for each player who helped in a run-out"));
        return out;
    }

    private void addXi(Map<String, Agg> all, List<String> xi, String teamName) {
        if (xi == null) return;
        for (String id : xi) {
            Agg a = all.computeIfAbsent(id, k -> {
                Agg n = new Agg();
                n.id = k;
                return n;
            });
            a.matches++;
            if (teamName != null) a.team = teamName;
        }
    }

    private Agg agg(Map<String, Agg> all, String id) {
        return all.computeIfAbsent(id, k -> {
            Agg n = new Agg();
            n.id = k;
            return n;
        });
    }

    /** Counts one innings. bat: 0 runs 1 balls 2 fours 3 sixes 4 out;  bowl: 0 legal 1 conceded 2 wickets 3 dots. */
    private void addInnings(Map<String, Agg> all, List<BallByBall> balls) {
        Map<String, int[]> bat = new LinkedHashMap<>();
        Map<String, int[]> bowl = new LinkedHashMap<>();

        for (BallByBall b : balls) {
            int runsBat = b.getRunsBatsman() == null ? 0 : b.getRunsBatsman();
            int extra = b.getRunsExtra() == null ? 0 : b.getRunsExtra();
            String ex = b.getExtraType();
            boolean wide = "Wide".equalsIgnoreCase(ex);
            boolean noBall = "NoBall".equalsIgnoreCase(ex);
            Wicket w = b.getWicket();

            for (String id : new String[]{b.getStrikerId(), b.getNonStrikerId(), b.getNewBatsmanId()}) {
                if (id != null) bat.computeIfAbsent(id, k -> new int[5]);
            }
            if (b.getStrikerId() != null) {
                int[] s = bat.get(b.getStrikerId());
                s[0] += runsBat;
                if (!wide) s[1]++;
                if (runsBat == 4) s[2]++;
                if (runsBat == 6) s[3]++;
            }
            if (w != null && w.getPlayerOutId() != null && w.getOutType() != Wicket.OutType.RETIRED_HURT) {
                bat.computeIfAbsent(w.getPlayerOutId(), k -> new int[5])[4] = 1;
            }

            if (b.getBowlerId() != null) {
                int[] o = bowl.computeIfAbsent(b.getBowlerId(), k -> new int[4]);
                if (!wide && !noBall) {
                    o[0]++;
                    if (runsBat == 0) o[3]++;
                }
                o[1] += runsBat + ((wide || noBall) ? extra : 0);
                if (w != null && b.getBowlerId().equals(w.getBowlerId()) && Boolean.TRUE.equals(w.getIsBowlerCredit())) o[2]++;
            }

            // fielding
            if (w != null) {
                Wicket.OutType type = w.getOutType();
                if (type == Wicket.OutType.CAUGHT && w.getFielderId() != null) agg(all, w.getFielderId()).catches++;
                if (type == Wicket.OutType.CAUGHT_BOWLED && w.getBowlerId() != null) agg(all, w.getBowlerId()).catches++;
                if (type == Wicket.OutType.STUMPED && w.getFielderId() != null) agg(all, w.getFielderId()).stumpings++;
                if (type == Wicket.OutType.RUNOUT) {
                    if (w.getFielderId() != null) agg(all, w.getFielderId()).runOuts++;
                    if (w.getAssistFielderIds() != null) {
                        for (String id : w.getAssistFielderIds()) agg(all, id).assists++;
                    }
                }
            }
        }

        for (Map.Entry<String, int[]> e : bat.entrySet()) {
            Agg a = agg(all, e.getKey());
            int[] s = e.getValue();
            a.batInnings++;
            a.runs += s[0];
            a.balls += s[1];
            a.fours += s[2];
            a.sixes += s[3];
            a.outs += s[4];
            a.highest = Math.max(a.highest, s[0]);
            if (s[0] >= 100) a.hundreds++; else if (s[0] >= 50) a.fifties++;
            if (s[4] == 1 && s[0] == 0 && s[1] >= 1) a.ducks++;
        }
        for (Map.Entry<String, int[]> e : bowl.entrySet()) {
            Agg a = agg(all, e.getKey());
            int[] o = e.getValue();
            a.bowlInnings++;
            a.legalBalls += o[0];
            a.conceded += o[1];
            a.wickets += o[2];
            a.dots += o[3];
            if (o[2] >= 5) a.fiveW++; else if (o[2] >= 3) a.threeW++;
            if (o[2] > a.bestW || (o[2] == a.bestW && o[1] < a.bestR)) {
                a.bestW = o[2];
                a.bestR = o[1];
            }
        }
    }

    private PlayerRow toRow(Agg a, String name) {
        PlayerRow r = new PlayerRow();
        r.setPlayerId(a.id);
        r.setName(name);
        r.setTeam(a.team);
        r.setMatches(a.matches);

        r.setBattingInnings(a.batInnings);
        r.setRuns(a.runs);
        r.setBalls(a.balls);
        r.setHighestScore(a.highest);
        r.setAverage(a.outs == 0 ? (a.batInnings == 0 ? 0 : a.runs) : round((double) a.runs / a.outs));
        r.setStrikeRate(a.balls == 0 ? 0 : round(a.runs * 100.0 / a.balls));
        r.setFours(a.fours);
        r.setSixes(a.sixes);
        r.setFifties(a.fifties);
        r.setHundreds(a.hundreds);

        r.setBowlingInnings(a.bowlInnings);
        r.setOvers(a.legalBalls / 6 + (a.legalBalls % 6 == 0 ? "" : "." + a.legalBalls % 6));
        r.setRunsConceded(a.conceded);
        r.setWickets(a.wickets);
        r.setBestFigures(a.bestW < 0 ? "-" : a.bestW + "/" + a.bestR);
        r.setEconomy(a.legalBalls == 0 ? 0 : round(a.conceded * 6.0 / a.legalBalls));
        r.setDotBalls(a.dots);

        r.setCatches(a.catches);
        r.setStumpings(a.stumpings);
        r.setRunOuts(a.runOuts);
        r.setRunOutAssists(a.assists);

        int bp = a.runs * RUN + a.fours * FOUR_BONUS + a.sixes * SIX_BONUS + a.fifties * FIFTY_BONUS
                + a.hundreds * HUNDRED_BONUS + a.ducks * DUCK;
        int wp = a.wickets * WICKET + a.dots * DOT_BALL + a.threeW * THREE_WICKETS + a.fiveW * FIVE_WICKETS;
        int fp = a.catches * CATCH + a.stumpings * STUMPING + a.runOuts * RUN_OUT + a.assists * RUN_OUT_ASSIST;
        r.setBattingPoints(bp);
        r.setBowlingPoints(wp);
        r.setFieldingPoints(fp);
        r.setMvpPoints(bp + wp + fp);
        return r;
    }

    private Map<String, String> namesOf(Collection<String> profileIds) {
        Map<String, Profile> profiles = new HashMap<>();
        profileRepository.findAllById(profileIds).forEach(p -> profiles.put(p.getId(), p));
        List<String> playerIds = new ArrayList<>();
        profiles.values().forEach(p -> {
            if (p.getPlayerId() != null) playerIds.add(p.getPlayerId());
        });
        Map<String, Player> players = new HashMap<>();
        playerRepository.findAllById(playerIds).forEach(p -> players.put(p.getId(), p));

        Map<String, String> names = new HashMap<>();
        for (String id : profileIds) {
            Profile p = profiles.get(id);
            Player pl = p == null || p.getPlayerId() == null ? null : players.get(p.getPlayerId());
            String name = pl == null ? null
                    : ((pl.getFirstName() == null ? "" : pl.getFirstName()) + " " + (pl.getLastName() == null ? "" : pl.getLastName())).trim();
            names.put(id, name == null || name.isEmpty() ? "Player" : name);
        }
        return names;
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
