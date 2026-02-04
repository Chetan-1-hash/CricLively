package com.CricLively.RestController;

import com.CricLively.DTO.PlayerCricketDetailsRequest;
import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.DTO.PlayerRegisterResponse;
import com.CricLively.Entities.Player;
import com.CricLively.Exceptions.RegistrationException;
import com.CricLively.Exceptions.UpdateCricketDetailsException;
import com.CricLively.Service.ImageStorageService;
import com.CricLively.Service.PlayerService;
import com.CricLively.Service.ProfileService;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/player")
public class PlayerController {

    private final PlayerService playerService;
    private final ProfileService profileService;

    public PlayerController(PlayerService playerService, ProfileService profileService) {
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
                                                                    @RequestPart(value = "image", required = false) MultipartFile image)throws UpdateCricketDetailsException {

        try{
            Player updatedPlayer = this.playerService.updateCricketDetails(playerId,request,image);
            System.out.println(image);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new PlayerRegisterResponse(
                            updatedPlayer.getId(),
                            updatedPlayer.getFirstName(),
                            "Details added successfully!"
                    )
            );
        } catch (UpdateCricketDetailsException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new PlayerRegisterResponse(
                            null,
                            null,
                            e.getClass().getSimpleName() + "-> " + e.getMessage()
                    ));
        }
    }

}
