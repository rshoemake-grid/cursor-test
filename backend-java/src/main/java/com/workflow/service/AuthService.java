package com.workflow.service;

import com.workflow.dto.TokenResponse;
import com.workflow.dto.UserCreate;
import com.workflow.dto.UserResponse;
import com.workflow.entity.RefreshToken;
import com.workflow.entity.User;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.RefreshTokenRepository;
import com.workflow.repository.UserRepository;
import com.workflow.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static com.workflow.constants.WorkflowConstants.TOKEN_TYPE_BEARER;

/**
 * Service for authentication business logic
 * SRP: Handles all authentication-related business operations
 */
@Service
@Transactional
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    
    private static final int REFRESH_TOKEN_EXPIRATION_DAYS = 7;
    
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    
    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }
    
    /**
     * Register a new user
     */
    public UserResponse register(UserCreate userCreate) {
        log.info("Registering new user: {}", userCreate.getUsername());
        
        validateUserCreate(userCreate);
        
        if (userRepository.existsByUsername(userCreate.getUsername())) {
            throw new ValidationException("Username already exists");
        }
        if (userRepository.existsByEmail(userCreate.getEmail())) {
            throw new ValidationException("Email already exists");
        }
        
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setUsername(userCreate.getUsername());
        user.setEmail(userCreate.getEmail());
        user.setHashedPassword(passwordEncoder.encode(userCreate.getPassword()));
        user.setFullName(userCreate.getFullName());
        user.setIsActive(true);
        user.setIsAdmin(false);
        user.setCreatedAt(LocalDateTime.now());
        
        User saved = userRepository.save(user);
        log.debug("Registered user with ID: {}", saved.getId());
        
        return toUserResponse(saved);
    }
    
    /**
     * Authenticate user and generate tokens
     */
    public TokenResponse login(UserCreate loginRequest) {
        log.info("Login attempt for user: {}", loginRequest.getUsername());
        
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());
        User user = userRepository.findByUsername(loginRequest.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId());
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());
        
        // Save refresh token
        saveRefreshToken(user.getId(), refreshToken);
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        log.debug("User {} logged in successfully", user.getUsername());
        
        return buildTokenResponse(accessToken, refreshToken);
    }
    
    /**
     * Refresh access token using refresh token
     */
    public TokenResponse refreshToken(String refreshTokenValue) {
        log.debug("Refreshing token");
        
        RefreshToken tokenEntity = refreshTokenRepository.findByToken(refreshTokenValue)
            .orElseThrow(() -> new ValidationException("Invalid refresh token"));
        
        if (tokenEntity.getRevoked() || tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ValidationException("Refresh token expired or revoked");
        }
        
        User user = userRepository.findById(tokenEntity.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        String newAccessToken = jwtUtil.generateToken(user.getUsername(), user.getId());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());
        
        // Update refresh token
        tokenEntity.setToken(newRefreshToken);
        tokenEntity.setExpiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRATION_DAYS));
        refreshTokenRepository.save(tokenEntity);
        
        log.debug("Token refreshed for user: {}", user.getUsername());
        
        return buildTokenResponse(newAccessToken, newRefreshToken);
    }
    
    /**
     * Build TokenResponse DTO
     * DRY: Centralizes token response building
     */
    private TokenResponse buildTokenResponse(String accessToken, String refreshToken) {
        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType(TOKEN_TYPE_BEARER);
        return response;
    }
    
    /**
     * Save refresh token to database
     */
    private void saveRefreshToken(String userId, String refreshToken) {
        RefreshToken refreshTokenEntity = new RefreshToken();
        refreshTokenEntity.setId(UUID.randomUUID().toString());
        refreshTokenEntity.setUserId(userId);
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setExpiresAt(LocalDateTime.now().plusDays(REFRESH_TOKEN_EXPIRATION_DAYS));
        refreshTokenEntity.setRevoked(false);
        refreshTokenRepository.save(refreshTokenEntity);
    }
    
    /**
     * Convert User entity to UserResponse DTO
     */
    private UserResponse toUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setIsActive(user.getIsActive());
        response.setIsAdmin(user.getIsAdmin());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());
        return response;
    }
    
    /**
     * Validate UserCreate DTO
     */
    private void validateUserCreate(UserCreate userCreate) {
        if (userCreate == null) {
            throw new ValidationException("User data is required");
        }
        if (userCreate.getUsername() == null || userCreate.getUsername().trim().isEmpty()) {
            throw new ValidationException("Username is required");
        }
        if (userCreate.getEmail() == null || userCreate.getEmail().trim().isEmpty()) {
            throw new ValidationException("Email is required");
        }
        if (userCreate.getPassword() == null || userCreate.getPassword().trim().isEmpty()) {
            throw new ValidationException("Password is required");
        }
    }
}
