package com.CricLively.Security;

import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Collections;
import java.util.List;

@Configuration
@AllArgsConstructor
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final ProfileDetailService userDetailService;

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(requests -> requests

                        // ---------- 1. PUBLIC: no login needed ----------
                        .requestMatchers("/", "/error").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/profile/login", "/profile/logout",
                                "/player/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/images/**").permitAll()

                        // ---------- 2. ADMIN only ----------
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/player/register/bulk", "/player/bulk/playerInfo").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/gallery/**").hasRole("ADMIN")

                        // ---------- 3. ORGANIZER (and ADMIN): create and run things ----------
                        .requestMatchers(HttpMethod.POST, "/tournaments", "/matches", "/team/addTeam",
                                "/images/upload").hasAnyRole("ORGANIZER", "ADMIN")
                        .requestMatchers("/profile/getProfileList").hasAnyRole("ORGANIZER", "ADMIN")

                        // ---------- 4. EVERY signed-in person: view + own profile ----------
                        .requestMatchers("/profile/me").hasAnyRole("PLAYER", "ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/player/*/playerInfo")
                                .hasAnyRole("PLAYER", "ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/tournaments/**", "/matches/**", "/team/**",
                                "/gallery/**", "/player/**").hasAnyRole("PLAYER", "ORGANIZER", "ADMIN")

                        // ---------- 5. Anything new is ORGANIZER/ADMIN until you decide otherwise ----------
                        .anyRequest().hasAnyRole("ORGANIZER", "ADMIN")
                )

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .httpBasic(AbstractHttpConfigurer::disable)
//                .httpBasic(Customizer.withDefaults())
                .userDetailsService(userDetailService)
                .build();
    };


    @Bean
    public CorsFilter corsFilter(){
        return new CorsFilter(corsConfigurationSource());
    }

    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Collections.singletonList("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance(); // 🔥 plain text
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

}
