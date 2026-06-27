package com.CricLively.Repository;

import com.CricLively.Entities.Tournament;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface TournamentRepository extends MongoRepository<Tournament, String> {

    Tournament findTournamentById(String id);

    boolean existsByNameAndVenueAndStartDateAndEndDate(
            String name,
            String venue,
            LocalDate startDate,
            LocalDate endDate
    );

}
