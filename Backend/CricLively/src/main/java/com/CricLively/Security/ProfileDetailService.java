package com.CricLively.Security;

import com.CricLively.Entities.Profile;
import com.CricLively.Repository.ProfileRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class ProfileDetailService implements UserDetailsService {

    @Autowired
    private ProfileRepository profileRepository;

    @Override
    public @NonNull UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        Profile profile = this.profileRepository.findByEmail(username).orElseThrow(
                () -> new UsernameNotFoundException("Email details not found")
        );
        return new User(profile.getEmail(), profile.getPassword(),new ArrayList<>());
    }
}
