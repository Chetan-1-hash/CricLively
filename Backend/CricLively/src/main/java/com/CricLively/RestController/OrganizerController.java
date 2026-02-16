package com.CricLively.RestController;

import com.CricLively.DTO.LoginRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/organizer")
@RequiredArgsConstructor
public class OrganizerController {

    private final ProfileRepository profileRepository;
    private final PlayerService playerService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest){
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        boolean isOrganizer = authentication.getAuthorities().stream().anyMatch(
                auth -> Objects.equals(auth.getAuthority(), "ROLE_ORGANIZER")
        );

        if(!isOrganizer){
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only ORGANIZER can login"));
        }
        SecurityContextHolder.getContext().setAuthentication(authentication);

        authentication.getAuthorities().forEach(auth ->
                System.out.println("AUTHORITY: " + auth.getAuthority())
        );


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

}
