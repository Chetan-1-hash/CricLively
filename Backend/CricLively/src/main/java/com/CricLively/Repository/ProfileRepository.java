package com.CricLively.Repository;

import com.CricLively.Entities.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProfileRepository extends MongoRepository<Profile, String> {

    Optional<Profile> findByEmail(String email);

    Optional<Profile> findByMobileNo(String mobileNo);

    Boolean existsByEmail(String email);

}
