package com.workflow.service;

import com.workflow.dto.*;
import com.workflow.entity.RefreshToken;
import com.workflow.entity.User;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.RefreshTokenRepository;
import com.workflow.repository.UserRepository;
import com.workflow.security.JwtUtil;

import java.lang.reflect.Field;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static com.workflow.constants.WorkflowConstants.TOKEN_TYPE_BEARER;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtUtil jwtUtil;  // Will create manually or use real instance

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserDetailsService userDetailsService;

    private AuthService authService;  // Create manually instead of @InjectMocks

    private UserCreate validUserCreate;
    private User userEntity;
    private UserResponse userResponse;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() throws Exception {
        // Create real JwtUtil instance with test configuration
        // Use reflection to set @Value fields since we're not in Spring context
        jwtUtil = new JwtUtil();
        setField(jwtUtil, "secret", "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm");
        setField(jwtUtil, "expiration", 3600000L); // 1 hour
        setField(jwtUtil, "refreshExpiration", 604800000L); // 7 days
        
        // Create AuthService manually since @InjectMocks doesn't work with manual construction
        authService = new AuthService(
            userRepository,
            refreshTokenRepository,
            passwordEncoder,
            jwtUtil,
            authenticationManager,
            userDetailsService
        );
        
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

        // Setup UserDetails
        userDetails = org.springframework.security.core.userdetails.User.builder()
            .username("testuser")
            .password("hashedPassword")
            .authorities("ROLE_USER")
            .build();
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
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(userDetailsService.loadUserByUsername(validUserCreate.getUsername())).thenReturn(userDetails);
        when(userRepository.findByUsername(validUserCreate.getUsername())).thenReturn(Optional.of(userEntity));
        when(userRepository.save(userEntity)).thenReturn(userEntity);

        // When
        TokenResponse result = authService.login(validUserCreate);

        // Then
        assertNotNull(result);
        assertNotNull(result.getAccessToken());  // Real jwtUtil generates actual tokens
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
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(userDetailsService.loadUserByUsername(validUserCreate.getUsername())).thenReturn(userDetails);
        when(userRepository.findByUsername(validUserCreate.getUsername())).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> authService.login(validUserCreate));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_Success() {
        // Given
        String refreshTokenValue = "refreshToken";
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setId("token-id");
        refreshTokenEntity.setUserId("user-id");
        refreshTokenEntity.setToken(refreshTokenValue);
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenEntity.setRevoked(false);

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(refreshTokenEntity));
        when(userRepository.findById("user-id")).thenReturn(Optional.of(userEntity));
        when(refreshTokenRepository.save(refreshTokenEntity)).thenReturn(refreshTokenEntity);

        // When
        TokenResponse result = authService.refreshToken(refreshTokenValue);

        // Then
        assertNotNull(result);
        assertNotNull(result.getAccessToken());  // Real jwtUtil generates actual tokens
        assertNotNull(result.getRefreshToken());
        assertEquals(TOKEN_TYPE_BEARER, result.getTokenType());
        verify(refreshTokenRepository, times(1)).findByToken(refreshTokenValue);
        verify(refreshTokenRepository, times(1)).save(refreshTokenEntity);
    }

    @Test
    void refreshToken_InvalidToken_ThrowsValidationException() {
        // Given
        String refreshTokenValue = "invalidToken";
        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ValidationException.class, () -> authService.refreshToken(refreshTokenValue));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_ExpiredToken_ThrowsValidationException() {
        // Given
        String refreshTokenValue = "refreshToken";
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().minusDays(1));
        refreshTokenEntity.setRevoked(false);

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(refreshTokenEntity));

        // When/Then
        assertThrows(ValidationException.class, () -> authService.refreshToken(refreshTokenValue));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_RevokedToken_ThrowsValidationException() {
        // Given
        String refreshTokenValue = "refreshToken";
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenEntity.setRevoked(true);

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(refreshTokenEntity));

        // When/Then
        assertThrows(ValidationException.class, () -> authService.refreshToken(refreshTokenValue));
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refreshToken_UserNotFound_ThrowsResourceNotFoundException() {
        // Given
        String refreshTokenValue = "refreshToken";
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setUserId("non-existent-user");
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshTokenEntity.setRevoked(false);

        when(refreshTokenRepository.findByToken(refreshTokenValue)).thenReturn(Optional.of(refreshTokenEntity));
        when(userRepository.findById("non-existent-user")).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> authService.refreshToken(refreshTokenValue));
        verify(refreshTokenRepository, never()).save(any());
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
