package com.CricLively.Security;

import com.CricLively.Entities.Profile;
import com.CricLively.Repository.ProfileRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProfileDetailService implements UserDetailsService {

    @Autowired
    private ProfileRepository profileRepository;

    @Override
    public @NonNull UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        Profile profile = this.profileRepository.findByEmail(username).orElseThrow(
                () -> new UsernameNotFoundException("Email details not found")
        );
        List<GrantedAuthority> authorities = profile.getRole().stream()
                .map(role -> (GrantedAuthority)
                        new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();

        return new User(profile.getEmail(), profile.getPassword(),authorities);
    }
}
