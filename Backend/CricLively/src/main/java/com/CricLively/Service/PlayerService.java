package com.CricLively.Service;

import com.CricLively.DTO.PlayerCricketDetailsRequest;
import com.CricLively.DTO.ProfileList;
import com.CricLively.Entities.Player;
import com.CricLively.Exceptions.UpdateCricketDetailsException;
import com.CricLively.Repository.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

        // Details can be changed again later. Only the fields that were sent are overwritten.
        if (details.getBattingStyle() != null) player.setBattingStyle(details.getBattingStyle());
        if (details.getBowlingStyle() != null) player.setBowlingStyle(details.getBowlingStyle());
        if (details.getPlayingRole() != null) player.setPlayingRole(details.getPlayingRole());
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

    @Transactional
    public void addBulkPlayers(List<Player> players) {

        for (Player player : players) {

            if (player.isCricketDetailsCompleted()) {
                player.setCricketDetailsCompleted(true);
            }

            playerRepository.save(player);
        }
    }


}
