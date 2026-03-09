package com.workflow.service;

import com.workflow.entity.PasswordResetToken;
import com.workflow.entity.User;
import com.workflow.exception.ValidationException;
import com.workflow.repository.PasswordResetTokenRepository;
import com.workflow.util.RepositoryUtils;
import com.workflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

/**
 * SRP-3: Password reset logic extracted from AuthService.
 */
@Service
public class PasswordResetService {
    private static final int PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${password-reset.return-token-in-response:false}")
    private boolean passwordResetReturnToken;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository passwordResetTokenRepository,
                                PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
        }

        String resetToken = generateSecureToken();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(PASSWORD_RESET_TOKEN_EXPIRATION_HOURS);

        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setId(UUID.randomUUID().toString());
        tokenEntity.setUserId(user.getId());
        tokenEntity.setToken(resetToken);
        tokenEntity.setExpiresAt(expiresAt);
        tokenEntity.setUsed(false);
        tokenEntity.setCreatedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(tokenEntity);

        if (passwordResetReturnToken) {
            return Map.of(
                    "message", "Password reset token generated. In production, this would be sent via email.",
                    "token", resetToken,
                    "reset_url", "/reset-password?token=" + resetToken
            );
        }

        return Map.of("message", "If an account with that email exists, a password reset link has been sent.");
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        PasswordResetToken tokenEntity = RepositoryUtils.orElseThrow(
                passwordResetTokenRepository.findByToken(token),
                () -> new ValidationException("Invalid or expired reset token"));

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ValidationException("Reset token has expired");
        }

        if (tokenEntity.getUsed()) {
            throw new ValidationException("Reset token has already been used");
        }

        User user = RepositoryUtils.findByIdOrThrow(userRepository, tokenEntity.getUserId(), "User not found");

        user.setHashedPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);

        return Map.of("message", "Password has been reset successfully");
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
