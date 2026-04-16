package com.workflow.service;

import com.workflow.dto.*;
import com.workflow.entity.RefreshToken;
import com.workflow.entity.User;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.PasswordResetTokenRepository;
import com.workflow.repository.RefreshTokenRepository;
import com.workflow.repository.UserRepository;
import com.workflow.security.JwtUtil;
import com.workflow.util.UserResponseMapper;

import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static com.workflow.constants.WorkflowConstants.TOKEN_TYPE_BEARER;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    private TokenService tokenService;
    private PasswordResetService passwordResetService;
    private UserResponseMapper userResponseMapper;

    private AuthService authService;

    private UserCreate validUserCreate;
    private User userEntity;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();
        setField(jwtUtil, "secret", "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm");
        setField(jwtUtil, "expiration", 3600000L);
        setField(jwtUtil, "refreshExpiration", 604800000L);

        userResponseMapper = new UserResponseMapper();
        tokenService = new TokenService(userRepository, refreshTokenRepository, jwtUtil, userResponseMapper);
        setField(tokenService, "jwtExpirationMs", 3600000L);

        passwordResetService = new PasswordResetService(userRepository, passwordResetTokenRepository, passwordEncoder, mock(org.springframework.core.env.Environment.class));
        setField(passwordResetService, "passwordResetReturnToken", false);

        authService = new AuthService(
            userRepository,
            passwordEncoder,
            jwtUtil,
            authenticationManager,
            tokenService,
            passwordResetService,
            userResponseMapper
        );
        setField(authService, "jwtExpirationMs", 3600000L);
        
        // Setup valid UserCreate
        validUserCreate = new UserCreate();
        validUserCreate.setUsername("testuser");
        validUserCreate.setEmail("test@example.com");
        validUserCreate.setPassword("password123");
        validUserCreate.setFullName("Test User");

        // Setup User entity
        userEntity = new User();
        userEntity.setId("user-id");
        userEntity.setUsername("testuser");
        userEntity.setEmail("test@example.com");
        userEntity.setHashedPassword("hashedPassword");
        userEntity.setFullName("Test User");
        userEntity.setIsActive(true);
        userEntity.setIsAdmin(false);
        userEntity.setCreatedAt(LocalDateTime.now());

        // Setup UserResponse
        userResponse = new UserResponse();
        userResponse.setId("user-id");
        userResponse.setUsername("testuser");
        userResponse.setEmail("test@example.com");
        userResponse.setFullName("Test User");
        userResponse.setIsActive(true);
        userResponse.setIsAdmin(false);
        userResponse.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void register_Success() {
        // Given
        when(userRepository.existsByUsername(validUserCreate.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(validUserCreate.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(validUserCreate.getPassword())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("user-id");
            u.setCreatedAt(LocalDateTime.now());
            return u;
        });

        // When
        UserResponse result = authService.register(validUserCreate);

        // Then
        assertNotNull(result);
        assertEquals("user-id", result.getId());
        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).existsByUsername(validUserCreate.getUsername());
        verify(userRepository, times(1)).existsByEmail(validUserCreate.getEmail());
        verify(passwordEncoder, times(1)).encode(validUserCreate.getPassword());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void register_UsernameExists_ThrowsValidationException() {
        // Given
        when(userRepository.existsByUsername(validUserCreate.getUsername())).thenReturn(true);

        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_EmailExists_ThrowsValidationException() {
        // Given
        when(userRepository.existsByUsername(validUserCreate.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(validUserCreate.getEmail())).thenReturn(true);

        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_NullUserCreate_ThrowsValidationException() {
        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(null));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_EmptyUsername_ThrowsValidationException() {
        // Given
        validUserCreate.setUsername("");

        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_EmptyEmail_ThrowsValidationException() {
        // Given
        validUserCreate.setEmail("");

        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_EmptyPassword_ThrowsValidationException() {
        // Given
        validUserCreate.setPassword("");

        // When/Then
        assertThrows(ValidationException.class, () -> authService.register(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_Success() {
        // Given
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(userRepository.findByUsernameOrEmail(validUserCreate.getUsername())).thenReturn(Optional.of(userEntity));
        when(userRepository.save(userEntity)).thenReturn(userEntity);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        TokenResponse result = authService.login(validUserCreate);

        // Then
        assertNotNull(result);
        assertNotNull(result.getAccessToken());
        assertNotNull(result.getRefreshToken());
        assertEquals(TOKEN_TYPE_BEARER, result.getTokenType());
        verify(authenticationManager, times(1)).authenticate(any());
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
        verify(userRepository, times(1)).save(userEntity);
    }

    @Test
    void login_InvalidCredentials_ThrowsException() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        // When/Then
        assertThrows(BadCredentialsException.class, () -> authService.login(validUserCreate));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_UserNotFound_ThrowsResourceNotFoundException() {
        // Given
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(userRepository.findByUsernameOrEmail(validUserCreate.getUsername())).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> authService.login(validUserCreate));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_Success() {
        // Given
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setId("token-id");
        refreshTokenEntity.setUserId("user-id");
        refreshTokenEntity.setToken("valid-refresh-token");
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenEntity.setRevoked(false);
        when(refreshTokenRepository.findByToken("valid-refresh-token")).thenReturn(Optional.of(refreshTokenEntity));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(userEntity));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        TokenResponse result = authService.refreshToken("valid-refresh-token");

        // Then
        assertNotNull(result);
        assertNotNull(result.getAccessToken());
        assertNotNull(result.getRefreshToken());
        assertEquals(TOKEN_TYPE_BEARER, result.getTokenType());
        verify(refreshTokenRepository, times(1)).findByToken("valid-refresh-token");
        verify(refreshTokenRepository, times(1)).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_InvalidToken_ThrowsValidationException() {
        when(refreshTokenRepository.findByToken("invalidToken")).thenReturn(Optional.empty());

        assertThrows(ValidationException.class, () -> authService.refreshToken("invalidToken"));
    }

    @Test
    void refreshToken_ExpiredToken_ThrowsValidationException() {
        RefreshToken expiredToken = new RefreshToken();
        expiredToken.setExpiresAt(LocalDateTime.now().minusDays(1));
        expiredToken.setRevoked(false);
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(expiredToken));

        assertThrows(ValidationException.class, () -> authService.refreshToken("expired-token"));
    }

    @Test
    void refreshToken_RevokedToken_ThrowsValidationException() {
        RefreshToken revokedToken = new RefreshToken();
        revokedToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        revokedToken.setRevoked(true);
        when(refreshTokenRepository.findByToken("revoked-token")).thenReturn(Optional.of(revokedToken));

        assertThrows(ValidationException.class, () -> authService.refreshToken("revoked-token"));
    }

    @Test
    void refreshToken_UserNotFound_ThrowsResourceNotFoundException() {
        RefreshToken tokenEntity = new RefreshToken();
        tokenEntity.setUserId("non-existent-user");
        tokenEntity.setExpiresAt(LocalDateTime.now().plusDays(7));
        tokenEntity.setRevoked(false);
        when(refreshTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(tokenEntity));
        when(userRepository.findById("non-existent-user")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.refreshToken("valid-token"));
    }

    @Test
    void getCurrentUser_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userEntity));

        UserResponse result = authService.getCurrentUser("testuser");

        assertNotNull(result);
        assertEquals("user-id", result.getId());
        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void getCurrentUser_NotFound_ThrowsResourceNotFoundException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.getCurrentUser("unknown"));
    }

    @Test
    void forgotPassword_UserNotFound_ReturnsStandardMessage() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        Map<String, Object> result = authService.forgotPassword("unknown@example.com");

        assertEquals("If an account with that email exists, a password reset link has been sent.", result.get("message"));
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void forgotPassword_UserExists_SavesTokenAndReturnsMessage() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(userEntity));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = authService.forgotPassword("test@example.com");

        assertEquals("If an account with that email exists, a password reset link has been sent.", result.get("message"));
        verify(passwordResetTokenRepository, times(1)).save(any());
    }

    @Test
    void resetPassword_Success() {
        com.workflow.entity.PasswordResetToken tokenEntity = new com.workflow.entity.PasswordResetToken();
        tokenEntity.setId("reset-id");
        tokenEntity.setUserId("user-id");
        tokenEntity.setToken("valid-reset-token");
        tokenEntity.setExpiresAt(LocalDateTime.now().plusHours(1));
        tokenEntity.setUsed(false);
        when(passwordResetTokenRepository.findByToken("valid-reset-token")).thenReturn(Optional.of(tokenEntity));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(userEntity));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(passwordResetTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> result = authService.resetPassword("valid-reset-token", "newPassword123");

        assertEquals("Password has been reset successfully", result.get("message"));
        verify(passwordEncoder, times(1)).encode("newPassword123");
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void resetPassword_InvalidToken_ThrowsValidationException() {
        when(passwordResetTokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(ValidationException.class, () -> authService.resetPassword("invalid-token", "newPassword"));
    }
    
    /**
     * Helper method to set private fields using reflection (for @Value injection in tests)
     */
    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
