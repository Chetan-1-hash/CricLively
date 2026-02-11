package com.CricLively.Repository;

import com.CricLively.DTO.ProfileList;
import com.CricLively.Entities.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ProfileRepository extends MongoRepository<Profile, String> {

    Optional<Profile> findByEmail(String email);

    Optional<Profile> findByMobileNumber(String mobileNumber);

    Boolean existsByEmail(String email);

    List<ProfileList> findAllBy();

}
