package com.CricLively.RestController;

import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Enums.MatchStatus;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Match;
import com.CricLively.Entities.Toss;
import com.CricLively.Service.BallByBallService;
import com.CricLively.Service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Supplier;

/**
 * Everything about scoring ONE match.
 *
 * WHO MAY CALL WHAT is decided in SecurityConfig, not here:
 *   GET  /matches/{id}/...   -> any logged-in person (this is the SCOREBOARD)
 *   POST /matches/{id}/...   -> ORGANIZER or ADMIN only (this is the SCORER)
 */
@RestController
@RequestMapping("/matches/{matchId}")
@RequiredArgsConstructor
public class ScoringController {

    private final MatchService matchService;
    private final BallByBallService ballByBallService;

    // =====================================================================
    // SCOREBOARD - read only, every logged-in person
    // =====================================================================

    /** Totals, toss, status and both innings summaries. */
    @GetMapping("/scoreboard")
    public ResponseEntity<?> scoreboard(@PathVariable String matchId) {
        return run(() -> matchService.getScoreboard(matchId));
    }

    /** Every ball of one innings, e.g. GET /matches/abc/balls?inningsNo=1 */
    @GetMapping("/balls")
    public ResponseEntity<?> balls(@PathVariable String matchId, @RequestParam Integer inningsNo) {
        return run(() -> {
            matchService.getScoreboard(matchId); // 404 if the match does not exist
            checkInningsNo(inningsNo);
            return ballByBallService.getBalls(matchId, inningsNo);
        });
    }

    // =====================================================================
    // SCORER - changes the match, ORGANIZER / ADMIN only
    // =====================================================================

    /** UPCOMING -> LIVE. Body: { "winnerId": "<teamId>", "decision": "BATTING" | "BOWLING" } */
    @PostMapping("/toss")
    public ResponseEntity<?> startMatch(@PathVariable String matchId, @RequestBody Toss toss) {
        return run(() -> {
            Match match = matchService.getScoreboard(matchId);
            if (match.getMatchStatus() != MatchStatus.UPCOMING) {
                throw new IllegalStateException("Match has already started or ended");
            }
            if (toss.getWinnerId() == null || toss.getDecision() == null) {
                throw new IllegalArgumentException("Toss needs winnerId and decision");
            }
            return matchService.startMatch(matchId, toss);
        });
    }

    @PostMapping("/innings1")
    public ResponseEntity<?> startInnings1(@PathVariable String matchId, @RequestBody Innings innings) {
        return run(() -> {
            requireLive(matchId);
            innings.setInningsNumber(1);
            return matchService.startInnings1(matchId, innings);
        });
    }

    @PostMapping("/innings2")
    public ResponseEntity<?> startInnings2(@PathVariable String matchId, @RequestBody Innings innings) {
        return run(() -> {
            requireLive(matchId);
            innings.setInningsNumber(2);
            return matchService.startInnings2(matchId, innings);
        });
    }

    /** Record one delivery. The match id always comes from the URL, never from the body. */
    @PostMapping("/balls")
    public ResponseEntity<?> recordBall(@PathVariable String matchId, @RequestBody BallByBall ball) {
        return run(() -> {
            requireLive(matchId);
            checkInningsNo(ball.getInningsNo());
            ball.setId(null);          // always create a NEW record, never overwrite one
            ball.setMatchId(matchId);
            return ballByBallService.recordBall(ball);
        });
    }

    @PostMapping("/finish")
    public ResponseEntity<?> finishMatch(@PathVariable String matchId) {
        return run(() -> {
            requireLive(matchId);
            return matchService.finishMatch(matchId);
        });
    }

    @PostMapping("/abandon")
    public ResponseEntity<?> abandonMatch(@PathVariable String matchId) {
        return run(() -> {
            Match match = matchService.getScoreboard(matchId);
            if (match.getMatchStatus() == MatchStatus.FINISHED) {
                throw new IllegalStateException("A finished match cannot be abandoned");
            }
            return matchService.abandonMatch(matchId);
        });
    }

    // =====================================================================
    // helpers
    // =====================================================================

    private void requireLive(String matchId) {
        Match match = matchService.getScoreboard(matchId);
        if (match.getMatchStatus() != MatchStatus.LIVE) {
            throw new IllegalStateException("Match is not live");
        }
    }

    private void checkInningsNo(Integer inningsNo) {
        if (inningsNo == null || (inningsNo != 1 && inningsNo != 2)) {
            throw new IllegalArgumentException("inningsNo must be 1 or 2");
        }
    }

    /** Runs the action and turns problems into clear HTTP answers. */
    private ResponseEntity<?> run(Supplier<Object> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
