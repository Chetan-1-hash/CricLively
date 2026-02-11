package com.CricLively.RestController;

import com.CricLively.DTO.TeamsList;
import com.CricLively.Entities.Team;
import com.CricLively.Repository.TeamRepository;
import com.CricLively.Service.MatchService;
import com.CricLively.Service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/team")
public class TeamController {

    private final MatchService matchService;
    private final TeamService  teamService;

    @PostMapping("/addTeam")
    public ResponseEntity<?> addTeam(@RequestBody Team team){
        try{
            this.teamService.createTeam(team);
            return new ResponseEntity<>(HttpStatus.OK);
        }
        catch(Exception e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Team already exists"+ e.getMessage());
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
