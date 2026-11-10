package com.CricLively.Service;

import com.CricLively.DTO.ScoreboardResponse;
import com.CricLively.Entities.*;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Repository.BallByBallRepository;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * The rules of scoring. Balls are the single source of truth:
 * after every change the innings totals are recomputed from the balls,
 * so "undo" and "refresh the page" can never disagree with the score.
 *
 * Match steps:  toss  ->  playing teams  ->  innings 1 (openers + bowler)  ->  balls  ->  innings 2 ...  ->  finish
 * WHO may do the steps is checked before these methods run (MatchAccessService).
 */
@Service
@RequiredArgsConstructor
public class ScoringService {

    static final int MIN_PLAYERS = 2;
    static final int MAX_PLAYERS = 11;

    private final MatchRepository matchRepository;
    private final BallByBallRepository ballRepository;
    private final TeamRepository teamRepository;
    private final PlayerRepository playerRepository;
    private final ProfileRepository profileRepository;

    // ------------------------------------------------------------ read

    public ScoreboardResponse getScoreboard(String matchId) {
        Match match = findMatch(matchId);
        Team teamA = teamRepository.findById(match.getTeamAId()).orElse(null);
        Team teamB = teamRepository.findById(match.getTeamBId()).orElse(null);

        List<String> squadA = squadOf(teamA);
        List<String> squadB = squadOf(teamB);

        Set<String> ids = new LinkedHashSet<>(squadA);
        ids.addAll(squadB);

        return ScoreboardResponse.builder()
                .matchId(match.getId())
                .tournamentId(match.getTournamentId())
                .venue(match.getVenue())
                .date(match.getDate())
                .time(match.getTime())
                .oversPerInnings(match.getOversPerInnings())
                .matchStatus(match.getMatchStatus())
                .matchType(match.getMatchType())
                .teamAId(match.getTeamAId())
                .teamAName(teamA != null ? teamA.getTeamName() : "Unknown team")
                .teamBId(match.getTeamBId())
                .teamBName(teamB != null ? teamB.getTeamName() : "Unknown team")
                .squadA(squadA)
                .squadB(squadB)
                .playingA(match.getPlayingXiA() == null ? List.of() : match.getPlayingXiA())
                .playingB(match.getPlayingXiB() == null ? List.of() : match.getPlayingXiB())
                .playerNames(namesOf(ids))
                .toss(match.getToss())
                .innings1(match.getInnings1())
                .innings2(match.getInnings2())
                .balls1(ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(matchId, 1))
                .balls2(ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(matchId, 2))
                .build();
    }

    public List<BallByBall> getBalls(String matchId, Integer inningsNo) {
        return ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(matchId, inningsNo);
    }

    // ------------------------------------------------------------ write

    public Match startMatch(String matchId, Toss toss) {
        Match match = findMatch(matchId);
        if (match.getMatchStatus() != MatchStatus.UPCOMING) {
            throw new IllegalStateException("Match has already started or ended");
        }
        if (toss == null || toss.getWinnerId() == null || toss.getDecision() == null) {
            throw new IllegalArgumentException("Toss needs winnerId and decision");
        }
        if (!toss.getWinnerId().equals(match.getTeamAId()) && !toss.getWinnerId().equals(match.getTeamBId())) {
            throw new IllegalArgumentException("Toss winner must be one of the two teams");
        }
        match.setToss(toss);
        match.setMatchStatus(MatchStatus.LIVE);
        return matchRepository.save(match);
    }

    /** Step 2: who plays today. Can be changed until the first innings starts. */
    public Match setLineup(String matchId, List<String> teamA, List<String> teamB) {
        Match match = findMatch(matchId);
        requireLive(match);
        if (match.getToss() == null) throw new IllegalStateException("Do the toss first");
        if (match.getInnings1() != null) throw new IllegalStateException("The innings has started, the playing teams are locked");

        Team a = teamRepository.findById(match.getTeamAId()).orElseThrow(() -> new IllegalArgumentException("Team 1 not found"));
        Team b = teamRepository.findById(match.getTeamBId()).orElseThrow(() -> new IllegalArgumentException("Team 2 not found"));

        match.setPlayingXiA(checkLineup(teamA, squadOf(a), a.getTeamName()));
        match.setPlayingXiB(checkLineup(teamB, squadOf(b), b.getTeamName()));
        return matchRepository.save(match);
    }

    public Match startInnings(String matchId, int inningsNo, Innings innings) {
        Match match = findMatch(matchId);
        requireLive(match);
        if (match.getToss() == null) throw new IllegalStateException("Do the toss first");
        if (isEmpty(match.getPlayingXiA()) || isEmpty(match.getPlayingXiB())) {
            throw new IllegalStateException("Pick the playing team of both sides first");
        }

        if (inningsNo == 1 && match.getInnings1() != null) throw new IllegalStateException("Innings 1 has already started");
        if (inningsNo == 2) {
            if (match.getInnings1() == null) throw new IllegalStateException("Start innings 1 first");
            if (!Boolean.TRUE.equals(match.getInnings1().getIsCompleted())) {
                throw new IllegalStateException("Innings 1 is not complete yet");
            }
            if (match.getInnings2() != null) throw new IllegalStateException("Innings 2 has already started");
        }

        if (innings == null
                || !isOneOf(innings.getBattingTeamId(), match.getTeamAId(), match.getTeamBId())
                || !isOneOf(innings.getBowlingTeamId(), match.getTeamAId(), match.getTeamBId())
                || Objects.equals(innings.getBattingTeamId(), innings.getBowlingTeamId())) {
            throw new IllegalArgumentException("Batting and bowling team must be the two teams of this match");
        }
        if (isBlank(innings.getCurrentStrikerId()) || isBlank(innings.getCurrentNonStrikerId())
                || isBlank(innings.getCurrentBowlerId())) {
            throw new IllegalArgumentException("Pick two opening batters and an opening bowler");
        }
        if (innings.getCurrentStrikerId().equals(innings.getCurrentNonStrikerId())) {
            throw new IllegalArgumentException("The two openers must be different players");
        }

        // openers must be in today's batting team, the bowler in today's bowling team
        List<String> battingXi = innings.getBattingTeamId().equals(match.getTeamAId()) ? match.getPlayingXiA() : match.getPlayingXiB();
        List<String> bowlingXi = innings.getBowlingTeamId().equals(match.getTeamAId()) ? match.getPlayingXiA() : match.getPlayingXiB();
        if (!battingXi.contains(innings.getCurrentStrikerId()) || !battingXi.contains(innings.getCurrentNonStrikerId())) {
            throw new IllegalArgumentException("Openers must be from the playing team");
        }
        if (!bowlingXi.contains(innings.getCurrentBowlerId())) {
            throw new IllegalArgumentException("The bowler must be from the playing team");
        }

        innings.setInningsNumber(inningsNo);
        innings.setTotalRuns(0);
        innings.setWicketsLost(0);
        innings.setOversCompleted(0.0);
        innings.setTotalExtras(0);
        innings.setIsCompleted(false);

        if (inningsNo == 1) match.setInnings1(innings); else match.setInnings2(innings);
        return matchRepository.save(match);
    }

    public BallByBall recordBall(String matchId, BallByBall ball) {
        Match match = findMatch(matchId);
        requireLive(match);

        Integer no = ball.getInningsNo();
        if (no == null || (no != 1 && no != 2)) throw new IllegalArgumentException("inningsNo must be 1 or 2");
        Innings innings = no == 1 ? match.getInnings1() : match.getInnings2();
        if (innings == null) throw new IllegalStateException("Start the innings first");
        if (Boolean.TRUE.equals(innings.getIsCompleted())) throw new IllegalStateException("This innings is already complete");

        if (isBlank(ball.getStrikerId()) || isBlank(ball.getNonStrikerId()) || isBlank(ball.getBowlerId())) {
            throw new IllegalArgumentException("Ball needs striker, non-striker and bowler");
        }
        if (ball.getRunsBatsman() == null) ball.setRunsBatsman(0);
        if (ball.getRunsExtra() == null) ball.setRunsExtra(0);
        if (ball.getRunsBatsman() < 0 || ball.getRunsBatsman() > 7 || ball.getRunsExtra() < 0 || ball.getRunsExtra() > 10) {
            throw new IllegalArgumentException("Runs are out of range");
        }

        ball.setId(null);                 // always a NEW record
        ball.setMatchId(matchId);         // the match always comes from the URL
        ball.setSeq(ballRepository.countByMatchIdAndInningsNo(matchId, no) + 1);
        BallByBall saved = ballRepository.save(ball);

        refreshSummary(match, no);
        return saved;
    }

    /** Remove the most recent ball of an innings and recompute the totals. */
    public void undoLastBall(String matchId, int inningsNo) {
        Match match = findMatch(matchId);
        requireLive(match);
        List<BallByBall> balls = ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(matchId, inningsNo);
        if (balls.isEmpty()) throw new IllegalStateException("No balls to undo");
        ballRepository.deleteById(balls.get(balls.size() - 1).getId());
        refreshSummary(match, inningsNo);
    }

    public Match finishMatch(String matchId) {
        Match match = findMatch(matchId);
        requireLive(match);
        match.setMatchStatus(MatchStatus.FINISHED);
        return matchRepository.save(match);
    }

    public Match abandonMatch(String matchId) {
        Match match = findMatch(matchId);
        if (match.getMatchStatus() == MatchStatus.FINISHED) {
            throw new IllegalStateException("A finished match cannot be abandoned");
        }
        match.setMatchStatus(MatchStatus.ABANDONED);
        return matchRepository.save(match);
    }

    // ------------------------------------------------------------ helpers

    private List<String> checkLineup(List<String> picked, List<String> squad, String teamName) {
        List<String> clean = new ArrayList<>(new LinkedHashSet<>(picked == null ? List.<String>of() : picked));
        if (clean.size() < MIN_PLAYERS || clean.size() > MAX_PLAYERS) {
            throw new IllegalArgumentException(teamName + ": pick between " + MIN_PLAYERS + " and " + MAX_PLAYERS + " players");
        }
        for (String id : clean) {
            if (!squad.contains(id)) throw new IllegalArgumentException(teamName + ": a picked player is not in the squad");
        }
        return clean;
    }

    private static List<String> squadOf(Team team) {
        return team != null && team.getSquadPlayerIds() != null ? team.getSquadPlayerIds() : List.of();
    }

    /**
     * Squads store PROFILE ids (that is what the team page picks from).
     * A profile points to its player, and the player has the name.
     */
    private Map<String, String> namesOf(Collection<String> ids) {
        Map<String, Profile> profiles = new HashMap<>();
        profileRepository.findAllById(ids).forEach(p -> profiles.put(p.getId(), p));

        Set<String> playerIds = new HashSet<>();
        for (String id : ids) {
            Profile p = profiles.get(id);
            if (p == null) playerIds.add(id);                        // the id may already be a player id
            else if (p.getPlayerId() != null) playerIds.add(p.getPlayerId());
        }
        Map<String, Player> players = new HashMap<>();
        playerRepository.findAllById(playerIds).forEach(p -> players.put(p.getId(), p));

        Map<String, String> names = new HashMap<>();
        for (String id : ids) {
            Profile p = profiles.get(id);
            Player pl = p == null ? players.get(id) : (p.getPlayerId() == null ? null : players.get(p.getPlayerId()));
            names.put(id, pl != null ? fullName(pl) : (p != null && p.getEmail() != null ? p.getEmail() : "Player"));
        }
        return names;
    }

    /** Totals come from the balls, never from a number typed in by someone. */
    private void refreshSummary(Match match, int inningsNo) {
        Innings innings = inningsNo == 1 ? match.getInnings1() : match.getInnings2();
        List<BallByBall> balls = ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(match.getId(), inningsNo);

        int runs = 0, extras = 0, wickets = 0, legal = 0;
        for (BallByBall b : balls) {
            int bat = b.getRunsBatsman() == null ? 0 : b.getRunsBatsman();
            int ex = b.getRunsExtra() == null ? 0 : b.getRunsExtra();
            runs += bat + ex;
            extras += ex;
            if (b.getWicket() != null) wickets++;
            if (isLegal(b.getExtraType())) legal++;
        }

        int maxBalls = (match.getOversPerInnings() == null ? 20 : match.getOversPerInnings()) * 6;
        boolean chaseDone = inningsNo == 2 && match.getInnings1() != null
                && match.getInnings1().getTotalRuns() != null
                && runs > match.getInnings1().getTotalRuns();

        innings.setTotalRuns(runs);
        innings.setTotalExtras(extras);
        innings.setWicketsLost(wickets);
        innings.setOversCompleted(legal / 6 + (legal % 6) / 10.0); // 14 balls -> 2.2
        innings.setIsCompleted(wickets >= 10 || legal >= maxBalls || chaseDone);
        matchRepository.save(match);
    }

    private static boolean isLegal(String extraType) {
        return !"Wide".equalsIgnoreCase(extraType) && !"NoBall".equalsIgnoreCase(extraType);
    }

    private static boolean isOneOf(String value, String a, String b) {
        return value != null && (value.equals(a) || value.equals(b));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static boolean isEmpty(List<String> l) {
        return l == null || l.isEmpty();
    }

    private static void requireLive(Match match) {
        if (match.getMatchStatus() != MatchStatus.LIVE) throw new IllegalStateException("Match is not live");
    }

    private Match findMatch(String matchId) {
        return matchRepository.findById(matchId).orElseThrow(() -> new NoSuchElementException("Match not found"));
    }

    private static String fullName(Player p) {
        StringBuilder sb = new StringBuilder();
        if (p.getFirstName() != null) sb.append(p.getFirstName());
        if (p.getLastName() != null) sb.append(' ').append(p.getLastName());
        String name = sb.toString().trim();
        return name.isEmpty() ? "Player" : name;
    }
}
