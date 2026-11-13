package com.CricLively.Service;

import com.CricLively.DTO.AddPlayerProfileRequest;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;
    private final PlayerService playerService;
    private final PlayerEligibilityService eligibilityService;


    @Transactional
    public Player register(PlayerRegisterRequest request) throws RegistrationException {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        String mobile = request.getMobileNumber() == null ? "" : request.getMobileNumber().trim();

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new RegistrationException("Valid email is required");
        }
        if (mobile.isEmpty()) {
            throw new RegistrationException("Mobile number is required");
        }
        if (this.profileRepository.existsByEmail(email) || this.profileRepository.existsByEmailIgnoreCase(email)) {
            throw new RegistrationException("Already registered");
        }
        if (this.profileRepository.findByMobileNumber(mobile).isPresent()) {
            throw new RegistrationException("Mobile number is already registered");
        }

        Player player = new Player();
        player.setFirstName(request.getFirstName());
        player.setMiddleName(request.getMiddleName());
        player.setLastName(request.getLastName());
        player.setDob(request.getDob());

        Player savedPlayer = playerRepository.save(player);

        Profile profile = new Profile();
        profile.setEmail(email);
        profile.setMobileNumber(mobile);
        profile.setPassword(request.getPassword());
        profile.setRole(Collections.singleton(Role.PLAYER));
        profile.setPlayerId(savedPlayer.getId());
        profile.setEmailVerified(false);
        profileRepository.save(profile);

        return savedPlayer;
    }

    /**
     * ORGANIZER or ADMIN creates a player + profile on behalf of a player.
     * Password is optional (a random temporary password is generated if omitted).
     */
    @Transactional
    public ProfileList createPlayerProfileByStaff(AddPlayerProfileRequest request) throws RegistrationException {
        String firstName = request.getFirstName() == null ? "" : request.getFirstName().trim();
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        String mobile = request.getMobileNumber() == null ? "" : request.getMobileNumber().trim();

        if (firstName.isEmpty()) {
            throw new RegistrationException("First name is required");
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new RegistrationException("Valid email address is required");
        }
        if (mobile.isEmpty()) {
            throw new RegistrationException("Mobile number is required");
        }
        if (request.getDob() != null && request.getDob().isAfter(LocalDate.now())) {
            throw new RegistrationException("Date of birth cannot be in the future");
        }
        if (profileRepository.existsByEmail(email) || profileRepository.existsByEmailIgnoreCase(email)) {
            throw new RegistrationException("Email is already registered: " + email);
        }
        if (profileRepository.findByMobileNumber(mobile).isPresent()) {
            throw new RegistrationException("Mobile number is already registered");
        }

        Player player = new Player();
        player.setFirstName(firstName);
        player.setMiddleName(request.getMiddleName() == null ? null : blankToNull(request.getMiddleName()));
        player.setLastName(request.getLastName() == null ? null : blankToNull(request.getLastName()));
        player.setDob(request.getDob());
        if (request.getBattingStyle() != null) player.setBattingStyle(request.getBattingStyle());
        if (request.getBowlingStyle() != null) player.setBowlingStyle(request.getBowlingStyle());
        if (request.getPlayingRole() != null) player.setPlayingRole(request.getPlayingRole());
        boolean hasDetails = request.getBattingStyle() != null
                || request.getBowlingStyle() != null
                || request.getPlayingRole() != null;
        player.setCricketDetailsCompleted(hasDetails);

        Player savedPlayer = playerRepository.save(player);

        String password = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : randomTempPassword();

        Profile profile = new Profile();
        profile.setEmail(email);
        profile.setMobileNumber(mobile);
        profile.setPassword(password);
        profile.setRole(Collections.singleton(Role.PLAYER));
        profile.setPlayerId(savedPlayer.getId());
        profile.setEmailVerified(false);
        Profile savedProfile = profileRepository.save(profile);

        ProfileList dto = new ProfileList();
        dto.setId(savedProfile.getId());
        dto.setEmail(savedProfile.getEmail());
        dto.setMobileNumber(savedProfile.getMobileNumber());
        dto.setFirstName(savedPlayer.getFirstName());
        dto.setMiddleName(savedPlayer.getMiddleName());
        dto.setLastName(savedPlayer.getLastName());
        dto.setRole(savedProfile.getRole());
        dto.setEmailVerified(false);
        dto.setMatchesPlayed(0);
        return dto;
    }

    private static String randomTempPassword() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Transactional
    public List<Player> registerBulk(List<PlayerRegisterRequest> requests) throws RegistrationException {

        List<Player> registeredPlayers = new ArrayList<>();

        for (PlayerRegisterRequest request : requests) {
            String email = request.getEmail() == null ? "" : request.getEmail().trim();
            if (profileRepository.existsByEmail(email) || profileRepository.existsByEmailIgnoreCase(email)) {
                throw new RegistrationException("Already registered: " + email);
            }

            Player player = new Player();
            player.setFirstName(request.getFirstName());
            player.setMiddleName(request.getMiddleName());
            player.setLastName(request.getLastName());
            player.setDob(request.getDob());

            Player savedPlayer = playerRepository.save(player);

            Profile profile = new Profile();
            profile.setEmail(email);
            profile.setMobileNumber(request.getMobileNumber());
            profile.setPassword(request.getPassword());
            profile.setRole(Collections.singleton(Role.PLAYER));
            profile.setPlayerId(savedPlayer.getId());
            profile.setEmailVerified(false);

            profileRepository.save(profile);

            registeredPlayers.add(savedPlayer);
        }

        return registeredPlayers;
    }

    public List<ProfileList> fetchProfileList() {
        Map<String, Integer> playedMap = eligibilityService.matchesPlayedMap(null);

        return profileRepository.findAll().stream()
                .filter(
                        p -> p.getRole() != null && (p.getRole().contains(Role.PLAYER) || p.getRole().contains(Role.ORGANIZER))
                )
                .map(profile -> {
                    ProfileList dto = new ProfileList();
                    dto.setId(profile.getId());
                    dto.setEmail(profile.getEmail());
                    dto.setRole(profile.getRole().stream()
                            .filter(r -> r == Role.PLAYER || r == Role.ORGANIZER)
                            .collect(Collectors.toSet())
                    );
                    dto.setMobileNumber(profile.getMobileNumber());
                    dto.setEmailVerified(profile.isEmailVerified());
                    dto.setMatchesPlayed(playedMap.getOrDefault(profile.getId(), 0));

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
        String trimmed = email == null ? "" : email.trim();
        Profile profile = profileRepository.findByEmail(trimmed)
                .or(() -> profileRepository.findByEmailIgnoreCase(trimmed))
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
        Map<String, Integer> playedMap = eligibilityService.matchesPlayedMap(null);
        return profileRepository.findAll().stream()
                .map(p -> toResponse(p, playedMap.getOrDefault(p.getId(), 0)))
                .toList();
    }

    /** Any logged-in person edits THEIR OWN info (the profile comes from the login, never from the request). */
    public MyProfileResponse updateMyInfo(String email, UpdateProfileRequest request) {
        String trimmed = email == null ? "" : email.trim();
        Profile profile = profileRepository.findByEmail(trimmed)
                .or(() -> profileRepository.findByEmailIgnoreCase(trimmed))
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
        if (request.getEmail() != null) {
            String email = request.getEmail().trim();
            if (email.isEmpty()) throw new IllegalArgumentException("Email cannot be empty");
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new IllegalArgumentException("Please enter a valid email address");
            }
            profileRepository.findByEmail(email).ifPresent(other -> {
                if (!other.getId().equals(profile.getId())) {
                    throw new IllegalArgumentException("This email is already used by another account");
                }
            });
            profileRepository.findByEmailIgnoreCase(email).ifPresent(other -> {
                if (!other.getId().equals(profile.getId())) {
                    throw new IllegalArgumentException("This email is already used by another account");
                }
            });
            String currentEmail = profile.getEmail() == null ? "" : profile.getEmail().trim();
            if (!email.equalsIgnoreCase(currentEmail)) {
                profile.setEmail(email);
                profile.setEmailVerified(false);
                profile.setEmailVerifiedAt(null);
                profile.setEmailVerificationCode(null);
                profile.setEmailVerificationExpiresAt(null);
                profile.setLastVerificationSentAt(null);
            } else if (!email.equals(currentEmail)) {
                profile.setEmail(email);
            }
        }

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

    public MyProfileResponse toResponse(Profile profile) {
        return toResponse(profile, eligibilityService.countMatchesPlayed(profile.getId(), null));
    }

    public MyProfileResponse toResponse(Profile profile, int matchesPlayed) {
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
                .organizerRequestStatus(profile.getOrganizerRequestStatus())
                .organizerRequestReason(profile.getOrganizerRequestReason())
                .organizerRequestAt(profile.getOrganizerRequestAt() == null ? null : profile.getOrganizerRequestAt().toString())
                .emailVerified(profile.isEmailVerified())
                .matchesPlayed(matchesPlayed)
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
        if (newRoles.contains(Role.ORGANIZER) || newRoles.contains(Role.ADMIN)) clearOrganizerRequest(profile);
        return profileRepository.save(profile);
    }

    private static void clearOrganizerRequest(Profile profile) {
        profile.setOrganizerRequestStatus(null);
        profile.setOrganizerRequestReason(null);
        profile.setOrganizerRequestAt(null);
    }

    // ------------------------------------------------ organizer requests

    /** A player asks to become an organizer. An admin decides. */
    public MyProfileResponse requestOrganizer(String email, String reason) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        Set<Role> roles = profile.getRole() == null ? Set.of() : profile.getRole();
        if (roles.contains(Role.ORGANIZER) || roles.contains(Role.ADMIN)) {
            throw new IllegalArgumentException("You are already an organizer");
        }
        if ("PENDING".equals(profile.getOrganizerRequestStatus())) {
            throw new IllegalArgumentException("Your request is already waiting for an admin");
        }
        String r = reason == null ? "" : reason.trim();
        if (r.length() < 5) throw new IllegalArgumentException("Tell the admin why you need organizer access (at least 5 characters)");
        if (r.length() > 300) throw new IllegalArgumentException("The reason is too long (300 characters at most)");

        profile.setOrganizerRequestStatus("PENDING");
        profile.setOrganizerRequestReason(r);
        profile.setOrganizerRequestAt(java.time.LocalDateTime.now());
        profileRepository.save(profile);
        return toResponse(profile);
    }

    public MyProfileResponse cancelOrganizerRequest(String email) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        clearOrganizerRequest(profile);
        profileRepository.save(profile);
        return toResponse(profile);
    }

    /** ADMIN: approve = the person becomes ORGANIZER (and stays PLAYER). */
    public MyProfileResponse approveOrganizer(String profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        Set<Role> roles = new HashSet<>(profile.getRole() == null ? Set.<Role>of() : profile.getRole());
        roles.add(Role.PLAYER);
        roles.add(Role.ORGANIZER);
        profile.setRole(roles);
        clearOrganizerRequest(profile);
        profileRepository.save(profile);
        return toResponse(profile);
    }

    /** ADMIN: reject = stays a player; the person sees it was rejected and may ask again later. */
    public MyProfileResponse rejectOrganizer(String profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        profile.setOrganizerRequestStatus("REJECTED");
        profileRepository.save(profile);
        return toResponse(profile);
    }

}
