package com.CricLively.RestController;


import com.CricLively.DTO.TournamentDashboardResponse;
import com.CricLively.Entities.Tournament;
import com.CricLively.Service.TournamentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    public TournamentController(TournamentService tournamentService) {
        this.tournamentService = tournamentService;
    }

    @GetMapping("/")
    public List<TournamentDashboardResponse> getTournamentDashboard(){
        return tournamentService.getTournamentDashboard();
    }

    @PostMapping("/")
    public ResponseEntity<String> addTournament(@RequestBody Tournament tournament){

        try{
            Tournament t = tournamentService.createTournament(tournament);
            return new ResponseEntity<>("Tournament Created", HttpStatus.OK);
        }
        catch (Exception e){
            System.out.println("Tournament exception: "+e.getMessage());
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
