package com.CricLively.RestController;

import com.CricLively.DTO.LoginRequest;
import com.CricLively.DTO.ProfileList;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Repository.ProfileRepository;
import com.CricLively.Service.PlayerService;
import com.CricLively.Service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileRepository profileRepository;
    private final PlayerService playerService;
    private final ProfileService profileService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest){
        Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        boolean isPlayer = authentication.getAuthorities().stream().anyMatch(
                auth -> Objects.equals(auth.getAuthority(), "ROLE_PLAYER")
        );

        if(!isPlayer){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only PLAYER can login"));
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);

        httpRequest.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext()
        );

        Profile profile = this.profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        Player player = playerService.getPlayer(profile.getPlayerId());

        return ResponseEntity.ok(Map.of(
                "playerId", player.getId(),
                "firstName", player.getFirstName(),
                "isCricketDetailsCompleted", player.isCricketDetailsCompleted(),
                "message", "Login Successful"
        ));
    }

    @GetMapping("/getProfileList")
    public ResponseEntity<List<ProfileList>> fetchPlayers() {
        try{
            return ResponseEntity.status(HttpStatus.OK).body(this.profileService.fetchProfileList());

        } catch (Exception e) {
            System.out.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

}
