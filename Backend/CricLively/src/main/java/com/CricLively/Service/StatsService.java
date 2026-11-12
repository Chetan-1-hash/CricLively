package com.CricLively.Service;

import com.CricLively.DTO.PersonalStatsResponse;
import com.CricLively.DTO.PersonalStatsResponse.StatLine;
import com.CricLively.DTO.PersonalStatsResponse.TournamentStats;
import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Entities.Tournament;
import com.CricLively.Entities.Wicket;
import com.CricLively.Repository.BallByBallRepository;
import com.CricLively.Repository.MatchRepository;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Personal statistics. Everything is counted from the ball-by-ball records of the matches
 * the person played (was in the playing team of), so the numbers always match the scoreboards.
 */
@Service
@RequiredArgsConstructor
public class StatsService {

    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final BallByBallRepository ballRepository;
    private final TournamentRepository tournamentRepository;

    public PersonalStatsResponse myStats(String email) {
        Profile me = profileRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        String pid = me.getId();

        PersonalStatsResponse out = new PersonalStatsResponse();
        Player player = me.getPlayerId() == null ? null : playerRepository.findById(me.getPlayerId()).orElse(null);
        if (player != null) {
            out.setPlayerName(((player.getFirstName() == null ? "" : player.getFirstName()) + " "
                    + (player.getLastName() == null ? "" : player.getLastName())).trim());
        }

        // matches I played: I was in a playing team and the match has started
        Map<String, List<Match>> byTournament = new LinkedHashMap<>();
        for (Match m : matchRepository.findAll()) {
            boolean started = m.getMatchStatus() == MatchStatus.LIVE || m.getMatchStatus() == MatchStatus.FINISHED;
            boolean played = (m.getPlayingXiA() != null && m.getPlayingXiA().contains(pid))
                    || (m.getPlayingXiB() != null && m.getPlayingXiB().contains(pid));
            if (started && played) {
                byTournament.computeIfAbsent(m.getTournamentId() == null ? "" : m.getTournamentId(), k -> new ArrayList<>()).add(m);
            }
        }

        Map<String, String> names = new HashMap<>();
        for (Tournament t : tournamentRepository.findAllById(
                byTournament.keySet().stream().filter(k -> !k.isEmpty()).toList())) {
            names.put(t.getId(), t.getName());
        }

        StatLine overall = out.getOverall();
        for (Map.Entry<String, List<Match>> e : byTournament.entrySet()) {
            TournamentStats ts = new TournamentStats();
            ts.setTournamentId(e.getKey().isEmpty() ? null : e.getKey());
            ts.setTournamentName(e.getKey().isEmpty() ? "Single matches" : names.getOrDefault(e.getKey(), "Tournament"));
            for (Match m : e.getValue()) {
                addMatch(ts.getStats(), pid, m);
                addMatch(overall, pid, m);
            }
            finish(ts.getStats());
            out.getTournaments().add(ts);
        }
        finish(overall);
        out.getTournaments().sort(Comparator.comparing(TournamentStats::getTournamentName, String.CASE_INSENSITIVE_ORDER));
        return out;
    }

    // ------------------------------------------------------------ counting

    private void addMatch(StatLine s, String pid, Match match) {
        s.setMatches(s.getMatches() + 1);
        for (int no = 1; no <= 2; no++) {
            List<BallByBall> balls = ballRepository.findByMatchIdAndInningsNoOrderBySeqAsc(match.getId(), no);
            addInnings(s, pid, balls);
        }
    }

    private void addInnings(StatLine s, String pid, List<BallByBall> balls) {
        boolean batted = false, out = false, bowled = false;
        int runs = 0, faced = 0, fours = 0, sixes = 0;
        int legalBowled = 0, conceded = 0, wickets = 0;
        int catches = 0, stumpings = 0, runOuts = 0, assists = 0;

        for (BallByBall b : balls) {
            int bat = b.getRunsBatsman() == null ? 0 : b.getRunsBatsman();
            int extra = b.getRunsExtra() == null ? 0 : b.getRunsExtra();
            String ex = b.getExtraType();
            boolean wide = "Wide".equalsIgnoreCase(ex);
            boolean noBall = "NoBall".equalsIgnoreCase(ex);
            Wicket w = b.getWicket();

            // ---- batting
            if (pid.equals(b.getStrikerId()) || pid.equals(b.getNonStrikerId()) || pid.equals(b.getNewBatsmanId())) {
                batted = true;
            }
            if (pid.equals(b.getStrikerId())) {
                runs += bat;
                if (!wide) faced++;
                if (bat == 4) fours++;
                if (bat == 6) sixes++;
            }
            if (w != null && pid.equals(w.getPlayerOutId()) && w.getOutType() != Wicket.OutType.RETIRED_HURT) {
                out = true;
                batted = true;
            }

            // ---- fielding: who took the catch / stumping / run-out (or helped in it)
            if (w != null) {
                Wicket.OutType type = w.getOutType();
                if (type == Wicket.OutType.CAUGHT && pid.equals(w.getFielderId())) catches++;
                if (type == Wicket.OutType.CAUGHT_BOWLED && pid.equals(w.getBowlerId())) catches++;
                if (type == Wicket.OutType.STUMPED && pid.equals(w.getFielderId())) stumpings++;
                if (type == Wicket.OutType.RUNOUT) {
                    if (pid.equals(w.getFielderId())) runOuts++;
                    if (w.getAssistFielderIds() != null && w.getAssistFielderIds().contains(pid)) assists++;
                }
            }

            // ---- bowling (byes and leg byes are not the bowler's runs)
            if (pid.equals(b.getBowlerId())) {
                bowled = true;
                if (!wide && !noBall) legalBowled++;
                conceded += bat + ((wide || noBall) ? extra : 0);
                if (w != null && pid.equals(w.getBowlerId()) && Boolean.TRUE.equals(w.getIsBowlerCredit())) wickets++;
            }
        }

        s.setCatches(s.getCatches() + catches);
        s.setStumpings(s.getStumpings() + stumpings);
        s.setRunOuts(s.getRunOuts() + runOuts);
        s.setRunOutAssists(s.getRunOutAssists() + assists);

        if (batted) {
            s.setBattingInnings(s.getBattingInnings() + 1);
            s.setRuns(s.getRuns() + runs);
            s.setBalls(s.getBalls() + faced);
            s.setFours(s.getFours() + fours);
            s.setSixes(s.getSixes() + sixes);
            s.setHighestScore(Math.max(s.getHighestScore(), runs));
            if (out) s.setOuts(s.getOuts() + 1); else s.setNotOuts(s.getNotOuts() + 1);
            if (runs >= 100) s.setHundreds(s.getHundreds() + 1);
            else if (runs >= 50) s.setFifties(s.getFifties() + 1);
        }
        if (bowled) {
            s.setBowlingInnings(s.getBowlingInnings() + 1);
            s.setBallsBowled(s.getBallsBowled() + legalBowled);
            s.setRunsConceded(s.getRunsConceded() + conceded);
            s.setWickets(s.getWickets() + wickets);
            if (wickets > s.getBestW() || (wickets == s.getBestW() && conceded < s.getBestR())) {
                s.setBestW(wickets);
                s.setBestR(conceded);
            }
        }
    }

    private void finish(StatLine s) {
        s.setAverage(s.getOuts() == 0 ? (s.getBattingInnings() == 0 ? 0 : s.getRuns()) : round((double) s.getRuns() / s.getOuts()));
        s.setStrikeRate(s.getBalls() == 0 ? 0 : round(s.getRuns() * 100.0 / s.getBalls()));
        s.setOvers(s.getBallsBowled() / 6 + (s.getBallsBowled() % 6 == 0 ? "" : "." + s.getBallsBowled() % 6));
        s.setEconomy(s.getBallsBowled() == 0 ? 0 : round(s.getRunsConceded() * 6.0 / s.getBallsBowled()));
        s.setBestFigures(s.getBestW() < 0 ? "-" : s.getBestW() + "/" + s.getBestR());
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
