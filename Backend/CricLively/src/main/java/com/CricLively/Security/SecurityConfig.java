package com.CricLively.Security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Collections;

@Configuration
@AllArgsConstructor
public class SecurityConfig {

    private final UserDetailService userDetailService;

    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(corsConfig -> corsConfig.configurationSource(new CorsConfigurationSource() {
                            @Override
                            public @NonNull CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
                                CorsConfiguration config = new CorsConfiguration();
                                config.setAllowedOrigins(Collections.singletonList("http://localhost:5173"));
                                config.setAllowedMethods(Collections.singletonList("*"));
                                config.setAllowedHeaders(Collections.singletonList("*"));
                                config.setAllowCredentials(true);
                                config.setMaxAge(3600L);
                                return config;
                            }
                        })

                )
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests((requests) ->requests
                                .requestMatchers("/", "/login", "register").permitAll()
                                .requestMatchers("/images/**").authenticated()
                                .requestMatchers("/player/**").authenticated()
                                .requestMatchers("/profile/**").authenticated()
                                .requestMatchers("/match").authenticated()
                                .requestMatchers("/tournaments","/addTournament").authenticated()
                        )
                .formLogin(Customizer.withDefaults())
                .httpBasic(Customizer.withDefaults())
                .userDetailsService(userDetailService)
                .build();
    };


}
