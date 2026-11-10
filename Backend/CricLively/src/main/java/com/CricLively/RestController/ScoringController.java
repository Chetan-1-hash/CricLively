package com.CricLively.RestController;

import com.CricLively.DTO.LineupRequest;
import com.CricLively.DTO.ScorersRequest;
import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Toss;
import com.CricLively.Service.MatchAccessService;
import com.CricLively.Service.ScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Supplier;

/**
 * Everything about scoring ONE match.
 *
 * Two layers decide who may call what:
 *   1. SecurityConfig:  GET = every logged-in person (SCOREBOARD),  POST/PUT/DELETE = organizer or admin
 *   2. MatchAccessService (below): of the organizers, only the match's own organizers may SCORE it
 */
@RestController
@RequestMapping("/matches/{matchId}")
@RequiredArgsConstructor
public class ScoringController {

    private final ScoringService scoringService;
    private final MatchAccessService accessService;

    // =====================================================================
    // SCOREBOARD - read only, every logged-in person
    // =====================================================================

    /** Teams, squads, playing teams, names, toss, both innings and every ball - in one call. */
    @GetMapping("/scoreboard")
    public ResponseEntity<?> scoreboard(@PathVariable String matchId) {
        return run(() -> scoringService.getScoreboard(matchId));
    }

    /** Every ball of one innings, e.g. GET /matches/abc/balls?inningsNo=1 */
    @GetMapping("/balls")
    public ResponseEntity<?> balls(@PathVariable String matchId, @RequestParam Integer inningsNo) {
        return run(() -> scoringService.getBalls(matchId, inningsNo));
    }

    /** Can I score this match? Can I give others access? Who already has access? */
    @GetMapping("/access")
    public ResponseEntity<?> access(@PathVariable String matchId, Authentication auth) {
        return run(() -> accessService.info(matchId, auth));
    }

    // =====================================================================
    // SCORING ACCESS - only the main organizer (or admin) of the match
    // =====================================================================

    /** Body: { "profileIds": ["..."] } = the full list of extra organizers who may score. */
    @PutMapping("/scorers")
    public ResponseEntity<?> setScorers(@PathVariable String matchId,
                                        @RequestBody ScorersRequest request,
                                        Authentication auth) {
        return run(() -> accessService.setScorers(matchId, request.getProfileIds(), auth));
    }

    // =====================================================================
    // SCORER - changes the match, only people with scoring access
    // =====================================================================

    /** Step 1: UPCOMING -> LIVE. Body: { "winnerId": "<teamId>", "decision": "BATTING" | "BOWLING" } */
    @PostMapping("/toss")
    public ResponseEntity<?> startMatch(@PathVariable String matchId, @RequestBody Toss toss, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.startMatch(matchId, toss));
    }

    /** Step 2: who plays today. Body: { "teamA": [ids], "teamB": [ids] } */
    @PostMapping("/lineup")
    public ResponseEntity<?> lineup(@PathVariable String matchId, @RequestBody LineupRequest request, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.setLineup(matchId, request.getTeamA(), request.getTeamB()));
    }

    /** Step 3: openers and opening bowler. */
    @PostMapping("/innings1")
    public ResponseEntity<?> startInnings1(@PathVariable String matchId, @RequestBody Innings innings, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.startInnings(matchId, 1, innings));
    }

    @PostMapping("/innings2")
    public ResponseEntity<?> startInnings2(@PathVariable String matchId, @RequestBody Innings innings, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.startInnings(matchId, 2, innings));
    }

    /** Record one delivery. The match id always comes from the URL, never from the body. */
    @PostMapping("/balls")
    public ResponseEntity<?> recordBall(@PathVariable String matchId, @RequestBody BallByBall ball, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.recordBall(matchId, ball));
    }

    /** Undo: removes the most recent ball of the innings. */
    @DeleteMapping("/balls/last")
    public ResponseEntity<?> undoLastBall(@PathVariable String matchId, @RequestParam Integer inningsNo, Authentication auth) {
        return scorer(matchId, auth, () -> {
            if (inningsNo == null || (inningsNo != 1 && inningsNo != 2)) {
                throw new IllegalArgumentException("inningsNo must be 1 or 2");
            }
            scoringService.undoLastBall(matchId, inningsNo);
            return Map.of("message", "Last ball removed");
        });
    }

    @PostMapping("/finish")
    public ResponseEntity<?> finishMatch(@PathVariable String matchId, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.finishMatch(matchId));
    }

    @PostMapping("/abandon")
    public ResponseEntity<?> abandonMatch(@PathVariable String matchId, Authentication auth) {
        return scorer(matchId, auth, () -> scoringService.abandonMatch(matchId));
    }

    /** Checks "may this person score THIS match?" first, then runs the action. */
    private ResponseEntity<?> scorer(String matchId, Authentication auth, Supplier<Object> action) {
        return run(() -> {
            accessService.requireScorer(matchId, auth);
            return action.get();
        });
    }

    /** Runs the action and turns problems into clear HTTP answers. */
    private ResponseEntity<?> run(Supplier<Object> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
