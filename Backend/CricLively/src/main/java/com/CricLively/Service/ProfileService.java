package com.CricLively.Service;

import com.CricLively.DTO.MyProfileResponse;
import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.DTO.ProfileList;
import com.CricLively.DTO.UpdateProfileRequest;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
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
        return toResponse(profile);
    }

    /** ADMIN: one profile by id. */
    public MyProfileResponse getProfileById(String profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        return toResponse(profile);
    }

    /** ADMIN: everybody. */
    public List<MyProfileResponse> getAllProfiles() {
        return profileRepository.findAll().stream().map(this::toResponse).toList();
    }

    /** Any logged-in person edits THEIR OWN info (the profile comes from the login, never from the request). */
    public MyProfileResponse updateMyInfo(String email, UpdateProfileRequest request) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return applyPersonalInfo(profile, request);
    }

    /** ADMIN edits anybody's info. */
    public MyProfileResponse updateInfoById(String profileId, UpdateProfileRequest request) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        return applyPersonalInfo(profile, request);
    }

    /** Checks everything first, saves afterwards, so a bad value changes nothing. */
    private MyProfileResponse applyPersonalInfo(Profile profile, UpdateProfileRequest request) {
        if (request.getMobileNumber() != null) {
            String mobile = request.getMobileNumber().trim();
            if (mobile.isEmpty()) throw new IllegalArgumentException("Mobile number cannot be empty");
            profileRepository.findByMobileNumber(mobile).ifPresent(other -> {
                if (!other.getId().equals(profile.getId())) {
                    throw new IllegalArgumentException("This mobile number is already used by another account");
                }
            });
            profile.setMobileNumber(mobile);
        }

        Player player = profile.getPlayerId() == null
                ? null
                : playerRepository.findById(profile.getPlayerId()).orElse(null);

        if (player != null) {
            if (request.getFirstName() != null) {
                String first = request.getFirstName().trim();
                if (first.isEmpty()) throw new IllegalArgumentException("First name cannot be empty");
                player.setFirstName(first);
            }
            if (request.getMiddleName() != null) player.setMiddleName(blankToNull(request.getMiddleName()));
            if (request.getLastName() != null) player.setLastName(blankToNull(request.getLastName()));
            if (request.getDob() != null) {
                if (request.getDob().isAfter(LocalDate.now())) {
                    throw new IllegalArgumentException("Date of birth cannot be in the future");
                }
                player.setDob(request.getDob());
            }
            playerRepository.save(player);
        }

        profileRepository.save(profile);
        return toResponse(profile);
    }

    private static String blankToNull(String s) {
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private MyProfileResponse toResponse(Profile profile) {
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
