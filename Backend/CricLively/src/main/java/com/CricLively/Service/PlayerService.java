package com.CricLively.Service;

import com.CricLively.DTO.PlayerCricketDetailsRequest;
import com.CricLively.DTO.PlayerRegisterRequest;
import com.CricLively.Entities.Enums.Role;
import com.CricLively.Entities.Player;
import com.CricLively.Entities.Profile;
import com.CricLively.Exceptions.RegistrationException;
import com.CricLively.Exceptions.UpdateCricketDetailsException;
import com.CricLively.Repository.PlayerRepository;
import com.CricLively.Repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final ImageStorageService imageStorageService;

    public PlayerService(PlayerRepository playerRepository, ImageStorageService imageStorageService) {
        this.playerRepository = playerRepository;
        this.imageStorageService = imageStorageService;
    }

    public Player getPlayer(String playerId) {
        return playerRepository.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found"));
    }

    @Transactional
    public Player updateCricketDetails(String playerId, PlayerCricketDetailsRequest details, MultipartFile imageFile) throws UpdateCricketDetailsException {
        Player player = getPlayer(playerId);

        if(this.playerRepository.existsByIdAndCricketDetailsCompleted(playerId,true)){
            throw new UpdateCricketDetailsException("Player details already exists");
        }

        player.setBattingStyle(details.getBattingStyle());
        player.setBowlingStyle(details.getBowlingStyle());
        player.setPlayingRole(details.getPlayingRole());
        if(imageFile != null && !imageFile.isEmpty()) {
                String imageId = imageStorageService.store(imageFile);
                player.setImage(imageId);
        }
//        player.setCareerStats(details.getCareerStats());

        // mark as completed
        player.setCricketDetailsCompleted(true);

        return playerRepository.save(player);
    }

    public Player updateStats(Player player) {
        return playerRepository.save(player);
    }

}
