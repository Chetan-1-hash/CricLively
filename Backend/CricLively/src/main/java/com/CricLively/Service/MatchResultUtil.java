package com.CricLively.Service;

import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Match;

import java.util.List;

/** Small helpers shared by the points table and the leaderboard. */
public final class MatchResultUtil {

    private MatchResultUtil() {
    }

    /** 15.2 overs (stored as a number) -> 92 balls. */
    public static int ballsOf(Double oversCompleted) {
        if (oversCompleted == null) return 0;
        int overs = (int) Math.floor(oversCompleted + 1e-9);
        int balls = (int) Math.round((oversCompleted - overs) * 10);
        return overs * 6 + balls;
    }

    /** The team was all out when every batter but one was out. */
    public static boolean allOut(Match match, Innings innings) {
        if (innings == null || innings.getWicketsLost() == null) return false;
        List<String> xi = innings.getBattingTeamId() != null && innings.getBattingTeamId().equals(match.getTeamAId())
                ? match.getPlayingXiA() : match.getPlayingXiB();
        int maxWickets = xi == null || xi.size() < 2 ? 10 : xi.size() - 1;
        return innings.getWicketsLost() >= maxWickets;
    }

    /** Balls used for net run rate: a team that was all out is counted as if it faced its full quota. */
    public static int ballsForNrr(Match match, Innings innings) {
        int quota = (match.getOversPerInnings() == null ? 20 : match.getOversPerInnings()) * 6;
        return allOut(match, innings) ? quota : ballsOf(innings.getOversCompleted());
    }

    /** Team id of the winner, or null for a tie / no result. */
    public static String winnerTeamId(Match match) {
        Innings i1 = match.getInnings1();
        Innings i2 = match.getInnings2();
        if (i1 == null || i2 == null || i1.getTotalRuns() == null || i2.getTotalRuns() == null) return null;
        if (i2.getTotalRuns() > i1.getTotalRuns()) return i2.getBattingTeamId();
        if (i2.getTotalRuns() < i1.getTotalRuns()) return i1.getBattingTeamId();
        return null;
    }

    /**
     * Counts for the tables: the scorer pressed "Finish", or both innings are already over
     * (so the tables do not wait for a button).
     */
    public static boolean isCompleted(Match match) {
        if (!hasResult(match)) return false;
        if (match.getMatchStatus() == com.CricLively.Entities.Enums.MatchStatus.FINISHED) return true;
        return match.getMatchStatus() == com.CricLively.Entities.Enums.MatchStatus.LIVE
                && Boolean.TRUE.equals(match.getInnings1().getIsCompleted())
                && Boolean.TRUE.equals(match.getInnings2().getIsCompleted());
    }

    /** A finished match with both innings played. */
    public static boolean hasResult(Match match) {
        return match.getInnings1() != null && match.getInnings2() != null
                && match.getInnings1().getTotalRuns() != null && match.getInnings2().getTotalRuns() != null;
    }
}
