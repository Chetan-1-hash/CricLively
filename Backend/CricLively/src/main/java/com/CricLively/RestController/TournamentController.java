package com.CricLively.RestController;


import com.CricLively.DTO.AddTournamentRequest;
import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Tournament;
import com.CricLively.Service.ImageStorageService;
import com.CricLively.Service.TournamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;
    private final ImageStorageService imageStorageService;


    @GetMapping
    public List<TournamentDashboardResponse> getTournamentDashboard(){
        return tournamentService.getTournamentDashboard();
    }


    @PostMapping
    public ResponseEntity<?> addTournament(
            @RequestPart("data") String data,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage
    ) {
        try {
            // Convert JSON string to DTO
            ObjectMapper mapper = new ObjectMapper();
            AddTournamentRequest tournament = mapper.readValue(data, AddTournamentRequest.class);

            // Use ImageStorageService to store the file in GridFS
            if (coverImage != null && !coverImage.isEmpty()) {
                String imageId = imageStorageService.store(coverImage); // store image in GridFS
                tournament.setCoverImage(imageId); // save GridFS ID, not filename
            }

            tournamentService.createTournament(tournament);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Tournament created successfully", "tournament", tournament));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/venue-exists")
    public ResponseEntity<List<String>> getVenue(){
        return ResponseEntity.ok(tournamentService.venuesList());
    }

}
