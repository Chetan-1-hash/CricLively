package com.CricLively.Service;

import com.CricLively.Entities.Profile;
import com.CricLively.Repository.ProfileRepository;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Email verification service sending 6-digit OTP + verification link over configured SMTP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ProfileRepository profileRepository;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttls;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.email.verification.ttl-minutes:15}")
    private int ttlMinutes;

    public Map<String, Object> sendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        String trimmed = email.trim();
        Profile profile = profileRepository.findByEmail(trimmed)
                .or(() -> profileRepository.findByEmailIgnoreCase(trimmed))
                .orElseThrow(() -> new IllegalArgumentException("Profile not found for email: " + trimmed));

        if (profile.isEmailVerified()) {
            Map<String, Object> res = new LinkedHashMap<>();
            res.put("alreadyVerified", true);
            res.put("email", profile.getEmail());
            res.put("message", "Email is already verified");
            return res;
        }

        if (!isSmtpConfigured()) {
            java.util.List<String> missing = new java.util.ArrayList<>();
            if (mailHost == null || mailHost.isBlank()) missing.add("MAIL_HOST");
            if (smtpAuth && (mailUsername == null || mailUsername.isBlank())) missing.add("MAIL_USERNAME");
            if (smtpAuth && (mailPassword == null || mailPassword.isBlank())) missing.add("MAIL_PASSWORD");
            throw new IllegalStateException(
                    "Email service is not configured (missing: " + String.join(", ", missing)
                            + "). Set them in IntelliJ Run Configuration / .env / application.properties and restart the backend.");
        }

        if (smtpAuth && mailHost.toLowerCase().contains("gmail") && !mailUsername.contains("@")) {
            throw new IllegalStateException(
                    "For Gmail SMTP, MAIL_USERNAME must be your full Gmail address (e.g. chetan17302@gmail.com), "
                            + "not the App Password label.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (profile.getLastVerificationSentAt() != null
                && profile.getLastVerificationSentAt().plusSeconds(30).isAfter(now)) {
            throw new IllegalArgumentException("Please wait 30 seconds before requesting another verification email");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        String verifyLink = buildVerificationLink(profile.getEmail(), code);
        sendSmtpEmail(profile.getEmail(), code, verifyLink);

        profile.setEmailVerificationCode(code);
        profile.setEmailVerificationExpiresAt(now.plusMinutes(Math.max(ttlMinutes, 1)));
        profile.setLastVerificationSentAt(now);
        profileRepository.save(profile);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("alreadyVerified", false);
        res.put("sentViaSmtp", true);
        res.put("email", profile.getEmail());
        res.put("expiresInMinutes", ttlMinutes);
        res.put("message", "Verification code sent to " + profile.getEmail());
        return res;
    }

    public Profile verifyEmail(String email, String code) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Verification code is required");
        }

        String trimmedEmail = email.trim();
        String trimmedCode = code.trim();
        Profile profile = profileRepository.findByEmail(trimmedEmail)
                .or(() -> profileRepository.findByEmailIgnoreCase(trimmedEmail))
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (profile.isEmailVerified()) {
            return profile;
        }

        if (profile.getEmailVerificationCode() == null || !profile.getEmailVerificationCode().equals(trimmedCode)) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        if (profile.getEmailVerificationExpiresAt() == null
                || LocalDateTime.now().isAfter(profile.getEmailVerificationExpiresAt())) {
            throw new IllegalArgumentException("Verification code has expired. Please request a new one");
        }

        profile.setEmailVerified(true);
        profile.setEmailVerifiedAt(LocalDateTime.now());
        profile.setEmailVerificationCode(null);
        profile.setEmailVerificationExpiresAt(null);
        return profileRepository.save(profile);
    }

    private boolean isSmtpConfigured() {
        if (mailHost == null || mailHost.isBlank()) {
            return false;
        }
        if (smtpAuth) {
            return mailUsername != null && !mailUsername.isBlank()
                    && mailPassword != null && !mailPassword.isBlank();
        }
        return true;
    }

    private String buildVerificationLink(String email, String code) {
        String base = frontendUrl == null ? "http://localhost:5173" : frontendUrl.replaceAll("/+$", "");
        return base + "/verify-email?email="
                + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8);
    }

    protected void sendSmtpEmail(String toEmail, String code, String verifyLink) {
        Properties props = new Properties();
        props.put("mail.smtp.host", mailHost.trim());
        props.put("mail.smtp.port", String.valueOf(mailPort));
        props.put("mail.smtp.auth", String.valueOf(smtpAuth));
        if (mailPort == 465) {
            props.put("mail.smtp.ssl.enable", "true");
        } else {
            props.put("mail.smtp.starttls.enable", String.valueOf(starttls));
        }
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        Session session;
        if (smtpAuth && mailUsername != null && !mailUsername.isBlank()) {
            String effectivePassword = mailHost.toLowerCase().contains("gmail") && mailPassword != null
                    ? mailPassword.replaceAll("\\s+", "")
                    : mailPassword;
            session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(mailUsername.trim(), effectivePassword);
                }
            });
        } else {
            session = Session.getInstance(props);
        }

        try {
            MimeMessage msg = new MimeMessage(session);
            String fromAddress = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom.trim() : mailUsername.trim();
            msg.setFrom(new InternetAddress(fromAddress));
            msg.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail, false));
            msg.setSubject("CricLively - Email Verification");
            String body = "Welcome to CricLively!\n\n"
                    + "Your email verification code is: " + code + "\n"
                    + "This code expires in " + ttlMinutes + " minutes.\n\n"
                    + "Or click this link to verify immediately:\n"
                    + verifyLink + "\n\n"
                    + "Note: Players can play 1 match without email verification. "
                    + "Verify your email to unlock unlimited matches and tournaments.";
            msg.setText(body, StandardCharsets.UTF_8.name());
            Transport.send(msg);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Could not send verification email. Check SMTP settings.");
        }
    }
}

