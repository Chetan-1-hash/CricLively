package com.CricLively.Service;

import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Exceptions.RegistrationException;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;

    public ProfileService(ProfileRepository profileRepository, PlayerRepository playerRepository) {
        this.profileRepository = profileRepository;
        this.playerRepository = playerRepository;
    }

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
        profile.setMobileNo(request.getMobileNumber());
        profile.setPassword(request.getPassword());
        profile.setRole(Role.PLAYER);
        profile.setPlayerId(savedPlayer.getId());
        profileRepository.save(profile);

        return savedPlayer;
    }


}
