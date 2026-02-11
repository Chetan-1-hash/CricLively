package com.CricLively.Service;

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
import java.util.List;

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

    @PostFilter("filterObject.role.contains(T(com.CricLively.Entities.Enums.Role).ORGANIZER)")
    public List<ProfileList> fetchProfileList() {

        return profileRepository.findAll().stream().map(profile -> {

            ProfileList dto = new ProfileList();
            dto.setId(profile.getId());
            dto.setRole(profile.getRole());
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

}
