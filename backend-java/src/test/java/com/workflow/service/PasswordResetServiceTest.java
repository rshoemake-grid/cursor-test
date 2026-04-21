package com.workflow.service;

import com.workflow.entity.PasswordResetToken;
import com.workflow.entity.User;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.PasswordResetTokenRepository;
import com.workflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Code Review 2026 (Low #10): Unit tests for PasswordResetService.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private PasswordResetService passwordResetService;

    private User userEntity;

    @BeforeEach
    void setUp() {
        org.springframework.core.env.Environment env = org.mockito.Mockito.mock(org.springframework.core.env.Environment.class);
        lenient().when(env.getActiveProfiles()).thenReturn(new String[0]);
        passwordResetService = new PasswordResetService(
                userRepository, passwordResetTokenRepository, passwordEncoder, env);
        ReflectionTestUtils.setField(passwordResetService, "passwordResetReturnToken", false);

        userEntity = new User();
        userEntity.setId("user-id");
        userEntity.setUsername("testuser");
        userEntity.setEmail("test@example.com");
        userEntity.setHashedPassword("oldHash");
    }

    @Test
    void forgotPassword_userNotFound_returnsStandardMessage() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

        Map<String, Object> result = passwordResetService.forgotPassword("unknown@example.com");

        assertEquals("If an account with that email exists, a password reset link has been sent.", result.get("message"));
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void forgotPassword_blankEmail_doesNotQueryRepository() {
        Map<String, Object> result = passwordResetService.forgotPassword("   ");

        assertEquals("If an account with that email exists, a password reset link has been sent.", result.get("message"));
        verify(userRepository, never()).findByEmailIgnoreCase(any());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void forgotPassword_emailDifferentCase_findsUser() {
        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(userEntity));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        passwordResetService.forgotPassword("TEST@EXAMPLE.COM");

        verify(userRepository, times(1)).findByEmailIgnoreCase("test@example.com");
    }

    @Test
    void forgotPassword_userExists_savesTokenAndReturnsMessage() {
        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(userEntity));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = passwordResetService.forgotPassword("test@example.com");

        assertEquals("If an account with that email exists, a password reset link has been sent.", result.get("message"));
        verify(passwordResetTokenRepository, times(1)).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_withReturnToken_returnsTokenInResponse() {
        ReflectionTestUtils.setField(passwordResetService, "passwordResetReturnToken", true);
        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(userEntity));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = passwordResetService.forgotPassword("test@example.com");

        assertTrue(result.containsKey("token"));
        assertTrue(result.containsKey("reset_url"));
        assertTrue(((String) result.get("reset_url")).contains("reset-password"));
    }

    @Test
    void resetPassword_success() {
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setId("reset-id");
        tokenEntity.setUserId("user-id");
        tokenEntity.setToken("valid-token");
        tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(1));
        tokenEntity.setUsed(false);
        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(tokenEntity));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(userEntity));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordEncoder.encode("newPassword123")).thenReturn("newHash");

        Map<String, Object> result = passwordResetService.resetPassword("valid-token", "newPassword123");

        assertEquals("Password has been reset successfully", result.get("message"));
        verify(passwordEncoder).encode("newPassword123");
        verify(userRepository).save(userEntity);
        assertTrue(tokenEntity.getUsed());
    }

    @Test
    void resetPassword_invalidToken_throwsValidationException() {
        when(passwordResetTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(ValidationException.class, () ->
                passwordResetService.resetPassword("invalid-token", "newPassword"));
    }

    @Test
    void resetPassword_expiredToken_throwsValidationException() {
        PasswordResetToken expiredToken = new PasswordResetToken();
        expiredToken.setExpiresAt(LocalDateTime.now().minusHours(1));
        expiredToken.setUsed(false);
        when(passwordResetTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(ValidationException.class, () ->
                passwordResetService.resetPassword("expired-token", "newPassword"));
    }

    @Test
    void resetPassword_alreadyUsed_throwsValidationException() {
        PasswordResetToken usedToken = new PasswordResetToken();
        usedToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        usedToken.setUsed(true);
        when(passwordResetTokenRepository.findByToken("used-token")).thenReturn(Optional.of(usedToken));

        assertThrows(ValidationException.class, () ->
                passwordResetService.resetPassword("used-token", "newPassword"));
    }

    @Test
    void resetPassword_userNotFound_throwsResourceNotFoundException() {
        PasswordResetToken tokenEntity = new PasswordResetToken();
        tokenEntity.setUserId("non-existent-user");
        tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(1));
        tokenEntity.setUsed(false);
        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(tokenEntity));
        when(userRepository.findById("non-existent-user")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                passwordResetService.resetPassword("valid-token", "newPassword"));
    }
}
