package com.CricLively.RestController;


import com.CricLively.DTO.AddTournamentRequest;
import com.CricLively.DTO.ExtendTournamentRequest;
import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Tournament;
import com.CricLively.Service.ImageStorageService;
import com.CricLively.Service.LeaderboardService;
import com.CricLively.Service.StandingsService;
import com.CricLively.Service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;
    private final ImageStorageService imageStorageService;
    private final StandingsService standingsService;
    private final LeaderboardService leaderboardService;


    @GetMapping
    public List<TournamentDashboardResponse> getTournamentDashboard(Authentication auth){
        return tournamentService.getTournamentDashboard(auth);
    }


    @PostMapping
    public ResponseEntity<?> addTournament(
            @RequestPart("data") String data,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            Authentication auth
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            AddTournamentRequest tournament = mapper.readValue(data, AddTournamentRequest.class);

            if (coverImage != null && !coverImage.isEmpty()) {
                String imageId = imageStorageService.store(coverImage);
                tournament.setCoverImage(imageId);
            }

            tournamentService.createTournament(tournament, auth);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Tournament created successfully",
                            "tournament", tournament
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /** Body: { "newEndDate": "2026-12-31", "reason": "Rain delayed the semi-finals" } */
    @PostMapping("/{id}/extend")
    public ResponseEntity<?> extend(@PathVariable String id, @RequestBody ExtendTournamentRequest request,
                                    Authentication auth) {
        try {
            return ResponseEntity.ok(tournamentService.extend(id, request, auth));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Team-wise points table: points, net run rate, form. Works out itself from the finished matches. */
    @GetMapping("/{id}/points-table")
    public ResponseEntity<?> pointsTable(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(standingsService.pointsTable(id, auth));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    /** Every player's batting, bowling, fielding and MVP numbers for this tournament. */
    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> leaderboard(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(leaderboardService.leaderboard(id, auth));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> follow(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(tournamentService.follow(id, auth));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<?> unfollow(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(tournamentService.unfollow(id, auth));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/venue-exists")
    public ResponseEntity<List<String>> getVenue(){
        return ResponseEntity.ok(tournamentService.venuesList());
    }

}
