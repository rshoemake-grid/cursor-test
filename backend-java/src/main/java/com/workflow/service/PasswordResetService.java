package com.workflow.service;

import com.workflow.entity.PasswordResetToken;
import com.workflow.entity.User;
import com.workflow.exception.ValidationException;
import com.workflow.repository.PasswordResetTokenRepository;
import com.workflow.util.EnvironmentUtils;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.ValidationUtils;
import com.workflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int PASSWORD_RESET_TOKEN_EXPIRATION_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${password-reset.return-token-in-response:false}")
    private boolean passwordResetReturnToken;

    @Value("${password-reset.base-url:}")
    private String passwordResetBaseUrl;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository passwordResetTokenRepository,
                                PasswordEncoder passwordEncoder,
                                Environment environment) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Transactional
    public Map<String, Object> forgotPassword(String email) {
        String normalized = ValidationUtils.normalizeEmail(email);
        if (normalized.isEmpty()) {
            return Map.of("message", ErrorMessages.PASSWORD_RESET_EMAIL_SENT);
        }
        User user = userRepository.findByEmailIgnoreCase(normalized).orElse(null);

        if (user == null) {
            return Map.of("message", ErrorMessages.PASSWORD_RESET_EMAIL_SENT);
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
            if (EnvironmentUtils.isProduction(environment)) {
                log.warn("password-reset.return-token-in-response is enabled in production - token exposure risk");
            }
            String resetPath = "/reset-password?token=" + resetToken;
            String resetUrl = (passwordResetBaseUrl != null && !passwordResetBaseUrl.isBlank())
                    ? passwordResetBaseUrl.replaceAll("/$", "") + resetPath
                    : resetPath;
            return Map.of(
                    "message", ErrorMessages.PASSWORD_RESET_TOKEN_DEV_MESSAGE,
                    "token", resetToken,
                    "reset_url", resetUrl
            );
        }

        return Map.of("message", ErrorMessages.PASSWORD_RESET_EMAIL_SENT);
    }

    @Transactional
    public Map<String, Object> resetPassword(String token, String newPassword) {
        PasswordResetToken tokenEntity = RepositoryUtils.orElseThrow(
                passwordResetTokenRepository.findByToken(token),
                () -> new ValidationException(ErrorMessages.INVALID_RESET_TOKEN));

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ValidationException(ErrorMessages.RESET_TOKEN_EXPIRED);
        }

        if (tokenEntity.getUsed()) {
            throw new ValidationException(ErrorMessages.RESET_TOKEN_ALREADY_USED);
        }

        User user = RepositoryUtils.findByIdOrThrow(userRepository, tokenEntity.getUserId(), ErrorMessages.USER_NOT_FOUND);

        user.setHashedPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);

        return Map.of("message", ErrorMessages.PASSWORD_RESET_SUCCESS);
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
