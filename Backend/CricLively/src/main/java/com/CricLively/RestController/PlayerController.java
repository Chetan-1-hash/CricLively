package com.CricLively.RestController;

import com.CricLively.DTO.PlayerCricketDetailsRequest;
import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.DTO.PlayerRegisterResponse;
import com.CricLively.Entities.Player;
import com.CricLively.Exceptions.RegistrationException;
import com.CricLively.Exceptions.UpdateCricketDetailsException;
import com.CricLively.Security.PlayerAccess;
import com.CricLively.Service.PlayerService;
import com.CricLively.Service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/player")
public class PlayerController {

    private final PlayerService playerService;
    private final ProfileService profileService;
    private final PlayerAccess playerAccess;

    public PlayerController(PlayerService playerService, ProfileService profileService, PlayerAccess playerAccess) {
        this.playerAccess = playerAccess;
        this.playerService = playerService;
        this.profileService = profileService;
    }

    @GetMapping("/{playerId}")
    public Player getPlayer(@PathVariable String playerId) {
        return playerService.getPlayer(playerId);
    }

    @PostMapping("/register")
    public ResponseEntity<PlayerRegisterResponse> registerPlayer(@RequestBody PlayerRegisterRequest player) throws RegistrationException {

        try{
            Player savedPlayer = this.profileService.register(player);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new PlayerRegisterResponse(
                            savedPlayer.getId(),savedPlayer.getFirstName(),"Registration successfully"
                    )
            );
        }
        catch (RegistrationException e){
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new PlayerRegisterResponse(
                            null,
                            null,
                            e.getClass().getSimpleName() + "- " + e.getMessage()
                    ));
        }

    }

    @PutMapping("/{playerId}/playerInfo")
    public ResponseEntity<PlayerRegisterResponse> addCricketDetails(@PathVariable String playerId,
                                                                    @RequestPart("data") PlayerCricketDetailsRequest request,
                                                                    @RequestPart(value = "image", required = false) MultipartFile image,
                                                                    Authentication authentication) throws UpdateCricketDetailsException {

        // players may only change their OWN details (admins may change anyone's)
        if (!playerAccess.canAccessPlayer(playerId, authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    new PlayerRegisterResponse(null, null, "You can only edit your own profile"));
        }

        try{
            Player updatedPlayer = this.playerService.updateCricketDetails(playerId,request,image);
            System.out.println(image);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new PlayerRegisterResponse(
                            updatedPlayer.getId(),
                            updatedPlayer.getFirstName(),
                            "Details saved successfully!"
                    )
            );
        } catch (UpdateCricketDetailsException e) {
            return ResponseEntity
                    .status(HttpStatus. BAD_REQUEST)
                    .body(new PlayerRegisterResponse(
                            null,
                            null,
                            e.getClass().getSimpleName() + "-> " + e.getMessage()
                    ));
        }
    }


    @PostMapping("/register/bulk")
    public ResponseEntity<List<PlayerRegisterResponse>> registerBulkPlayers(
            @RequestBody List<PlayerRegisterRequest> players) {

        try {
            List<Player> savedPlayers = profileService.registerBulk(players);

            List<PlayerRegisterResponse> response = savedPlayers.stream()
                    .map(p -> new PlayerRegisterResponse(
                            p.getId(),
                            p.getFirstName(),
                            "Registered successfully"
                    ))
                    .toList();

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RegistrationException e) {
            System.out.print(e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/bulk/playerInfo")
    public ResponseEntity<String> addBulkPlayers(@RequestBody List<Player> players) {
        playerService.addBulkPlayers(players);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Bulk players added successfully");
    }



}
