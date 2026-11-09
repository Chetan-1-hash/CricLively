package com.CricLively.RestController;

import com.CricLively.DTO.AddMatchDTO;
import com.CricLively.DTO.MatchDashboardDTO;
import com.CricLively.Entities.Match;
import com.CricLively.Service.MatchService;
import org.springframework.http.ResponseEntity;
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
    public List<MatchDashboardDTO> getAllMatches(){
        return matchService.getAllMatches();
    }

    @GetMapping("/{tournamentId}")
    public List<MatchDashboardDTO> getTournamentMatches(@PathVariable String tournamentId){
        return matchService.getTournamentMatches(tournamentId);
    }

    @PostMapping
    public ResponseEntity<?> addMatch(@RequestBody AddMatchDTO addmatch) {
        try{
            matchService.addMatch(addmatch);
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
