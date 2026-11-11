package com.CricLively.Security;

import com.CricLively.Repository.ProfileRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The login session remembers the roles from the moment of login. When an admin approves
 * someone as organizer, this filter picks up the new roles on the very next request,
 * so the person does not have to log out and in again.
 */
public class RoleRefreshFilter extends OncePerRequestFilter {

    private final ProfileRepository profileRepository;

    public RoleRefreshFilter(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            profileRepository.findByEmail(auth.getName()).ifPresent(profile -> {
                Set<String> fresh = new HashSet<>();
                if (profile.getRole() != null) profile.getRole().forEach(r -> fresh.add("ROLE_" + r.name()));
                Set<String> current = auth.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
                if (!fresh.equals(current)) {
                    List<GrantedAuthority> list = fresh.stream()
                            .map(a -> (GrantedAuthority) new SimpleGrantedAuthority(a)).toList();
                    SecurityContextHolder.getContext().setAuthentication(
                            UsernamePasswordAuthenticationToken.authenticated(auth.getPrincipal(), auth.getCredentials(), list));
                }
            });
        }
        chain.doFilter(request, response);
    }
}
