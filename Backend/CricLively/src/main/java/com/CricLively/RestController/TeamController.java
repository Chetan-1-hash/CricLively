package com.CricLively.RestController;

import com.CricLively.DTO.AddTournamentRequest;
import com.CricLively.DTO.TeamsList;
import com.CricLively.Entities.Team;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Service.ImageStorageService;
import com.CricLively.Service.MatchService;
import com.CricLively.Service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/team")
public class TeamController {

    private final MatchService matchService;
    private final TeamService  teamService;
    private final ImageStorageService imageStorageService;

    @PostMapping("/addTeam")
    public ResponseEntity<?> addTeam(@RequestPart("data") String data,
                                     @RequestPart(value = "logoImage", required = false) MultipartFile logoImage){
        try{
            ObjectMapper mapper = new ObjectMapper();
            Team team = mapper.readValue(data, Team.class);

            // Use ImageStorageService to store the file in GridFS
            if (logoImage != null && !logoImage.isEmpty()) {
                String imageId = imageStorageService.store(logoImage); // store image in GridFS
                team.setLogoImage(imageId); // save GridFS ID, not filename
            }
            this.teamService.createTeam(team);
            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message", "Team created successfully"
                    )
            );
        }
        catch(Exception e){
            return ResponseEntity
                    .badRequest()
                    .body(Map.of(
                            "success", false,
                            "message", "Could not create team: " + e.getMessage()
                    ));
        }
    }

    @GetMapping("/getTeamsList")
    public ResponseEntity<List<TeamsList>> fetchTeamsList(){
        try{
            return ResponseEntity.status(HttpStatus.OK).body(this.teamService.fetchTeamNames());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

}
