package com.CricLively.Service;

import com.CricLively.DTO.MyProfileResponse;
import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.DTO.ProfileList;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Exceptions.RegistrationException;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PostFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PreFilter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;
    private final PlayerService playerService;


    @Transactional
    public Player register(PlayerRegisterRequest request) throws RegistrationException {

        if(this.profileRepository.existsByEmail(request.getEmail())){
            throw new RegistrationException("Already registered");
        }

        Player player = new Player();
        player.setFirstName(request.getFirstName());
        player.setMiddleName(request.getMiddleName());
        player.setLastName(request.getLastName());
        player.setDob(request.getDob());

        Player savedPlayer = playerRepository.save(player);

        Profile profile = new Profile();
        profile.setEmail(request.getEmail());
        profile.setMobileNumber(request.getMobileNumber());
        profile.setPassword(request.getPassword());
        profile.setRole(Collections.singleton(Role.PLAYER));
        profile.setPlayerId(savedPlayer.getId());
        profileRepository.save(profile);

        return savedPlayer;
    }

    @Transactional
    public List<Player> registerBulk(List<PlayerRegisterRequest> requests) throws RegistrationException {

        List<Player> registeredPlayers = new ArrayList<>();

        for (PlayerRegisterRequest request : requests) {

            if (profileRepository.existsByEmail(request.getEmail())) {
                throw new RegistrationException("Already registered: " + request.getEmail());
            }

            Player player = new Player();
            player.setFirstName(request.getFirstName());
            player.setMiddleName(request.getMiddleName());
            player.setLastName(request.getLastName());
            player.setDob(request.getDob());

            Player savedPlayer = playerRepository.save(player);

            Profile profile = new Profile();
            profile.setEmail(request.getEmail());
            profile.setMobileNumber(request.getMobileNumber());
            profile.setPassword(request.getPassword());
            profile.setRole(Collections.singleton(Role.PLAYER));
            profile.setPlayerId(savedPlayer.getId());

            profileRepository.save(profile);

            registeredPlayers.add(savedPlayer);
        }

        return registeredPlayers;
    }

    public List<ProfileList> fetchProfileList() {

        return profileRepository.findAll().stream()
                .filter(
                        p -> p.getRole().contains(Role.PLAYER) || p.getRole().contains(Role.ORGANIZER)
                )
                .map(profile -> {
                    ProfileList dto = new ProfileList();
                    dto.setId(profile.getId());
                    dto.setRole(profile.getRole().stream()
                            .filter(r -> r == Role.PLAYER || r == Role.ORGANIZER)
                            .collect(Collectors.toSet())
                    );
                    dto.setMobileNumber(profile.getMobileNumber());

                    // ONLY players have names
                    if (profile.getPlayerId() != null) {
                        Player player = playerService.getPlayer(profile.getPlayerId());
                        dto.setFirstName(player.getFirstName());
                        dto.setMiddleName(player.getMiddleName());
                        dto.setLastName(player.getLastName());
                    }
                    return dto;
                }).toList();
    }

    /** Everything the app needs to know about the person who is logged in. */
    public MyProfileResponse getMyProfile(String email) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Profile not found"));

        Player player = profile.getPlayerId() == null
                ? null
                : playerRepository.findById(profile.getPlayerId()).orElse(null);

        List<String> roles = profile.getRole() == null
                ? List.of()
                : profile.getRole().stream().map(Role::name).sorted().toList();

        return MyProfileResponse.builder()
                .profileId(profile.getId())
                .playerId(profile.getPlayerId())
                .email(profile.getEmail())
                .mobileNumber(profile.getMobileNumber())
                .roles(roles)
                .firstName(player != null ? player.getFirstName() : null)
                .middleName(player != null ? player.getMiddleName() : null)
                .lastName(player != null ? player.getLastName() : null)
                .dob(player != null && player.getDob() != null ? player.getDob().toString() : null)
                .isCricketDetailsCompleted(player != null ? player.isCricketDetailsCompleted() : null)
                .battingStyle(player != null && player.getBattingStyle() != null
                        ? player.getBattingStyle().name() : null)
                .bowlingStyle(player != null && player.getBowlingStyle() != null
                        ? player.getBowlingStyle().name() : null)
                .playingRole(player != null && player.getPlayingRole() != null
                        ? player.getPlayingRole().name() : null)
                .image(player != null ? player.getImage() : null)
                .build();
    }

    /** Admin decides someone's roles. Everybody always stays a PLAYER. */
    public Profile updateRoles(String profileId, Set<Role> roles, String actingEmail) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        Set<Role> newRoles = new HashSet<>(roles == null ? Set.<Role>of() : roles);
        newRoles.add(Role.PLAYER);

        // an admin must not lock themselves out
        if (actingEmail != null && actingEmail.equals(profile.getEmail()) && !newRoles.contains(Role.ADMIN)) {
            throw new IllegalArgumentException("You cannot remove your own ADMIN role");
        }

        profile.setRole(newRoles);
        return profileRepository.save(profile);
    }

}
