package com.CricLively.RestController;

import com.CricLively.Service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    /** MY statistics only. There is no id in the URL on purpose: it is always the logged-in person. */
    @GetMapping("/me")
    public ResponseEntity<?> myStats(Authentication auth) {
        try {
            return ResponseEntity.ok(statsService.myStats(auth.getName()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
