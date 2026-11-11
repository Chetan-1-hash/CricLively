package com.CricLively.RestController;

import com.CricLively.DTO.AddMatchDTO;
import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.Match;
import com.CricLively.Service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping
    public List<MatchDashboardDTO> getAllMatches(Authentication auth){
        return matchService.getAllMatches(auth);
    }

    @GetMapping("/{tournamentId}")
    public ResponseEntity<?> getTournamentMatches(@PathVariable String tournamentId, Authentication auth){
        try {
            return ResponseEntity.ok(matchService.getTournamentMatches(tournamentId, auth));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addMatch(@RequestBody AddMatchDTO addmatch, Authentication auth) {
        try{
            matchService.addMatch(addmatch, auth.getName());
            System.out.println("Match created successfully");
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Match created successfully"
                    )
            );
        }
        catch (IllegalArgumentException e) {
            // a mistake in the form: show the message as it is
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
        catch(Exception e){
            System.out.println(e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Error while creating match: " + e.getMessage()
                    ));
        }
    }

}
