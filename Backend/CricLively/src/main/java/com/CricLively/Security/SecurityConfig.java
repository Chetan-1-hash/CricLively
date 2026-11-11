package com.CricLively.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
@RequiredArgsConstructor
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final ProfileDetailService userDetailService;

    /** Where the React app runs. Change it in application.properties (app.cors.allowed-origin), several origins: comma separated. */
    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

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
                        .requestMatchers(HttpMethod.POST, "/tournaments", "/tournaments/*/extend", "/matches", "/team/addTeam",
                                "/images/upload").hasAnyRole("ORGANIZER", "ADMIN")
                        .requestMatchers("/profile/getProfileList").hasAnyRole("ORGANIZER", "ADMIN")

                        // SCORER: anything that CHANGES a match (toss, innings, balls, finish, abandon)
                        .requestMatchers(HttpMethod.POST, "/matches/**").hasAnyRole("ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/matches/**").hasAnyRole("ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/matches/**").hasAnyRole("ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/matches/**").hasAnyRole("ORGANIZER", "ADMIN")

                        // ---------- 4. EVERY signed-in person: view + own profile ----------
                        .requestMatchers("/ws/**").hasAnyRole("PLAYER", "ORGANIZER", "ADMIN") // live score connection
                        .requestMatchers("/profile/me").hasAnyRole("PLAYER", "ORGANIZER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/player/*/playerInfo")
                                .hasAnyRole("PLAYER", "ORGANIZER", "ADMIN")
                        // SCOREBOARD: GET /matches/{id}/scoreboard and /balls are covered by "/matches/**" below
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
        config.setAllowedOrigins(java.util.Arrays.stream(allowedOrigin.split(",")).map(String::trim).toList());
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
