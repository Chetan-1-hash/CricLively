package com.CricLively.RestController;

import com.CricLively.DTO.LoginRequest;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Service.PlayerService;
import com.CricLively.Service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final PlayerService playerService;

    public ProfileController(ProfileRepository profileRepository, PlayerService playerService) {
        this.profileRepository = profileRepository;
        this.playerService = playerService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request){
        Profile profile = this.profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        if(!profile.getPassword().equals(request.getPassword())){
            return  ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Player player = playerService.getPlayer(profile.getPlayerId());
        System.out.println(player.isCricketDetailsCompleted());

        return ResponseEntity.ok(Map.of(
                "playerId", player.getId(),
                "firstName", player.getFirstName(),
                "isCricketDetailsCompleted", player.isCricketDetailsCompleted(),
                "message", "Login Successful"
        ));
    }

}
