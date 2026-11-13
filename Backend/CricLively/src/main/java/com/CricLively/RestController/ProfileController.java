package com.CricLively.RestController;

import com.CricLively.DTO.LoginRequest;
import com.CricLively.DTO.MyProfileResponse;
import com.CricLively.DTO.ProfileList;
import com.CricLively.DTO.UpdateProfileRequest;
import com.CricLively.DTO.VerifyEmailRequest;
import com.CricLively.Entities.Profile;
import com.CricLively.Security.ProfileDetailService;
import com.CricLively.Service.EmailVerificationService;
import com.CricLively.Service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * ONE login for everybody (player, organizer, admin).
 * What a person may DO is decided by their roles in SecurityConfig, not by which login they used.
 */
@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final EmailVerificationService emailVerificationService;
    private final ProfileDetailService profileDetailService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletRequest httpReq,
                                   HttpServletResponse httpRes) {

        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email and password are required"));
        }

        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        // new session id after login (protects against session fixation)
        if (httpReq.getSession(false) != null) {
            httpReq.changeSessionId();
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpReq, httpRes);

        MyProfileResponse me = profileService.getMyProfile(auth.getName());
        me.setMessage("Login Successful");
        return ResponseEntity.ok(me);
    }

    /** Who is logged in right now? Works for every role. */
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        return ResponseEntity.ok(profileService.getMyProfile(auth.getName()));
    }

    /** A player asks to become an organizer. Body: { "reason": "I run our club's tournaments" } */
    @PostMapping("/me/organizer-request")
    public ResponseEntity<?> requestOrganizer(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            return ResponseEntity.ok(profileService.requestOrganizer(auth.getName(), body.get("reason")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/me/organizer-request")
    public ResponseEntity<?> cancelOrganizerRequest(Authentication auth) {
        try {
            return ResponseEntity.ok(profileService.cancelOrganizerRequest(auth.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** A person edits THEIR OWN profile. There is no id in the URL on purpose: it is always "me". */
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody UpdateProfileRequest request,
                                      Authentication auth,
                                      HttpServletRequest httpReq,
                                      HttpServletResponse httpRes) {
        try {
            MyProfileResponse updated = profileService.updateMyInfo(auth.getName(), request);
            if (updated.getEmail() != null && !updated.getEmail().equals(auth.getName())) {
                UserDetails updatedUser = profileDetailService.loadUserByUsername(updated.getEmail());
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        updatedUser, null, updatedUser.getAuthorities()));
                SecurityContextHolder.setContext(context);
                securityContextRepository.saveContext(context, httpReq, httpRes);
            }
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Send a free email verification code / link to the logged-in user's email. */
    @PostMapping("/me/send-verification")
    public ResponseEntity<?> sendMyVerification(Authentication auth) {
        try {
            return ResponseEntity.ok(emailVerificationService.sendVerification(auth.getName()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Verify the logged-in user's email with the 6-digit code. */
    @PostMapping("/me/verify-email")
    public ResponseEntity<?> verifyMyEmail(@RequestBody VerifyEmailRequest request, Authentication auth) {
        try {
            Profile verified = emailVerificationService.verifyEmail(auth.getName(), request.getCode());
            return ResponseEntity.ok(profileService.toResponse(verified));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Public verification endpoint used when clicking the link from an email. */
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailRequest request) {
        try {
            Profile verified = emailVerificationService.verifyEmail(request.getEmail(), request.getCode());
            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "email", verified.getEmail(),
                    "message", "Email verified successfully!"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    /** Used by organizers/admins to pick players for teams and tournaments. */
    @GetMapping("/getProfileList")
    public ResponseEntity<List<ProfileList>> fetchPlayers() {
        try {
            return ResponseEntity.status(HttpStatus.OK).body(this.profileService.fetchProfileList());
        } catch (Exception e) {
            System.out.println(e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

}
