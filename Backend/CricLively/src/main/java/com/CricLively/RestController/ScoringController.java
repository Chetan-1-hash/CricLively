package com.CricLively.RestController;

import com.CricLively.Entities.BallByBall;
import com.CricLively.Entities.Innings;
import com.CricLively.Entities.Toss;
import com.CricLively.Service.ScoringService;
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
 *   GET    /matches/{id}/...   -> any logged-in person (this is the SCOREBOARD)
 *   POST / DELETE ...          -> ORGANIZER or ADMIN only (this is the SCORER)
 * The rules (is the match live? is the innings over?) live in ScoringService.
 */
@RestController
@RequestMapping("/matches/{matchId}")
@RequiredArgsConstructor
public class ScoringController {

    private final ScoringService scoringService;

    // =====================================================================
    // SCOREBOARD - read only, every logged-in person
    // =====================================================================

    /** Teams, squads, names, toss, both innings and every ball - in one call. */
    @GetMapping("/scoreboard")
    public ResponseEntity<?> scoreboard(@PathVariable String matchId) {
        return run(() -> scoringService.getScoreboard(matchId));
    }

    /** Every ball of one innings, e.g. GET /matches/abc/balls?inningsNo=1 */
    @GetMapping("/balls")
    public ResponseEntity<?> balls(@PathVariable String matchId, @RequestParam Integer inningsNo) {
        return run(() -> scoringService.getBalls(matchId, inningsNo));
    }

    // =====================================================================
    // SCORER - changes the match, ORGANIZER / ADMIN only
    // =====================================================================

    /** UPCOMING -> LIVE. Body: { "winnerId": "<teamId>", "decision": "BATTING" | "BOWLING" } */
    @PostMapping("/toss")
    public ResponseEntity<?> startMatch(@PathVariable String matchId, @RequestBody Toss toss) {
        return run(() -> scoringService.startMatch(matchId, toss));
    }

    @PostMapping("/innings1")
    public ResponseEntity<?> startInnings1(@PathVariable String matchId, @RequestBody Innings innings) {
        return run(() -> scoringService.startInnings(matchId, 1, innings));
    }

    @PostMapping("/innings2")
    public ResponseEntity<?> startInnings2(@PathVariable String matchId, @RequestBody Innings innings) {
        return run(() -> scoringService.startInnings(matchId, 2, innings));
    }

    /** Record one delivery. The match id always comes from the URL, never from the body. */
    @PostMapping("/balls")
    public ResponseEntity<?> recordBall(@PathVariable String matchId, @RequestBody BallByBall ball) {
        return run(() -> scoringService.recordBall(matchId, ball));
    }

    /** Undo: removes the most recent ball of the innings. */
    @DeleteMapping("/balls/last")
    public ResponseEntity<?> undoLastBall(@PathVariable String matchId, @RequestParam Integer inningsNo) {
        return run(() -> {
            if (inningsNo == null || (inningsNo != 1 && inningsNo != 2)) {
                throw new IllegalArgumentException("inningsNo must be 1 or 2");
            }
            scoringService.undoLastBall(matchId, inningsNo);
            return Map.of("message", "Last ball removed");
        });
    }

    @PostMapping("/finish")
    public ResponseEntity<?> finishMatch(@PathVariable String matchId) {
        return run(() -> scoringService.finishMatch(matchId));
    }

    @PostMapping("/abandon")
    public ResponseEntity<?> abandonMatch(@PathVariable String matchId) {
        return run(() -> scoringService.abandonMatch(matchId));
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
