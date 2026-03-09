package com.workflow.service;

import com.workflow.dto.LoginRequest;
import com.workflow.dto.TokenResponse;
import com.workflow.dto.UserCreate;
import com.workflow.dto.UserResponse;
import com.workflow.entity.User;
import com.workflow.exception.ValidationException;
import com.workflow.repository.UserRepository;
import com.workflow.util.RepositoryUtils;
import com.workflow.security.JwtUtil;
import com.workflow.util.UserResponseMapper;
import com.workflow.util.ValidationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for authentication business logic.
 * SRP-3: Delegates to TokenService, PasswordResetService, UserResponseMapper.
 */
@Service
@Transactional
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long REMEMBER_ME_EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000; // 7 days

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final PasswordResetService passwordResetService;
    private final UserResponseMapper userResponseMapper;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationMs;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager, TokenService tokenService,
                       PasswordResetService passwordResetService, UserResponseMapper userResponseMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.passwordResetService = passwordResetService;
        this.userResponseMapper = userResponseMapper;
    }

    public UserResponse register(UserCreate userCreate) {
        validateUserCreate(userCreate);

        log.info("Registering new user: {}", userCreate.getUsername());

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

        return userResponseMapper.toUserResponse(saved);
    }

    public TokenResponse login(LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getPassword() == null) {
            throw new ValidationException("Username and password are required");
        }

        log.info("Login attempt for user: {}", loginRequest.getUsername());

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        User user = RepositoryUtils.orElseThrow(userRepository.findByUsername(loginRequest.getUsername()), "User not found");

        boolean rememberMe = Boolean.TRUE.equals(loginRequest.getRememberMe());
        long accessTokenExpirationMs = rememberMe ? REMEMBER_ME_EXPIRATION_MS : jwtExpirationMs;
        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), accessTokenExpirationMs);
        String refreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());

        tokenService.saveRefreshToken(user.getId(), refreshToken);

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        log.debug("User {} logged in successfully", user.getUsername());

        return tokenService.buildTokenResponse(accessToken, refreshToken, user, accessTokenExpirationMs / 1000);
    }

    public TokenResponse login(UserCreate loginRequest) {
        LoginRequest req = new LoginRequest();
        req.setUsername(loginRequest.getUsername());
        req.setPassword(loginRequest.getPassword());
        req.setRememberMe(false);
        return login(req);
    }

    public TokenResponse refreshToken(String refreshTokenValue) {
        return tokenService.refreshToken(refreshTokenValue);
    }

    public UserResponse getCurrentUser(String username) {
        User user = RepositoryUtils.orElseThrow(userRepository.findByUsername(username), "User not found");
        return userResponseMapper.toUserResponse(user);
    }

    public java.util.Map<String, Object> forgotPassword(String email) {
        return passwordResetService.forgotPassword(email);
    }

    public java.util.Map<String, Object> resetPassword(String token, String newPassword) {
        return passwordResetService.resetPassword(token, newPassword);
    }

    private void validateUserCreate(UserCreate userCreate) {
        ValidationUtils.requireNonNull(userCreate, "User data");
        ValidationUtils.requireNonEmpty(userCreate.getUsername(), "Username");
        ValidationUtils.requireNonEmpty(userCreate.getEmail(), "Email");
        ValidationUtils.requireNonEmpty(userCreate.getPassword(), "Password");
    }
}
