package com.workflow.controller;

import com.workflow.dto.LoginRequest;
import com.workflow.dto.PasswordReset;
import com.workflow.exception.ValidationException;
import com.workflow.util.AuthenticationHelper;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ErrorResponseBuilder;
import com.workflow.dto.PasswordResetRequest;
import com.workflow.dto.RefreshTokenRequest;
import com.workflow.dto.TokenResponse;
import com.workflow.dto.UserCreate;
import com.workflow.dto.UserResponse;
import com.workflow.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;


/**
 * Auth Controller - matches Python auth_routes.py
 * SRP: Only handles HTTP requests/responses, delegates business logic to service
 * Endpoints: /api/auth/*
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and authorization")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final AuthenticationHelper authenticationHelper;

    public AuthController(AuthService authService, AuthenticationHelper authenticationHelper) {
        this.authService = authService;
        this.authenticationHelper = authenticationHelper;
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User", description = "Get current authenticated user information")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Current user details"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    public ResponseEntity<?> me(Authentication authentication, HttpServletRequest request) {
        if (!authenticationHelper.isAuthenticated(authentication)) {
            return ErrorResponseBuilder.unauthorized(ErrorMessages.UNAUTHORIZED, request.getRequestURI());
        }
        log.debug("GET /api/auth/me - Current user: {}", authentication.getName());
        UserResponse response = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/token")
    @Operation(summary = "Login (OAuth2)", description = "Authenticate via OAuth2 password flow (form-urlencoded)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<TokenResponse> token(
            @RequestParam String username,
            @RequestParam String password) {
        String u = username == null ? "" : username.trim();
        if (u.isEmpty() || password == null || password.isBlank()) {
            throw new ValidationException(ErrorMessages.USERNAME_PASSWORD_REQUIRED);
        }
        log.debug("POST /api/auth/token - OAuth2 login for user: {}", u);
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(u);
        loginRequest.setPassword(password);
        loginRequest.setRememberMe(false);
        TokenResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Register User", description = "Register a new user account")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User registered successfully"),
        @ApiResponse(responseCode = "422", description = "Validation error (username/email already exists)")
    })
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserCreate userCreate) {
        log.debug("POST /api/auth/register - Registering user: {}", userCreate.getUsername());
        
        UserResponse response = authService.register(userCreate);
        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and receive access/refresh tokens. Supports remember_me for 7-day token expiry.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login successful"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.debug("POST /api/auth/login - Login attempt for user: {}", loginRequest.getUsername());
        
        TokenResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh Token", description = "Refresh access token using refresh token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
        @ApiResponse(responseCode = "422", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.debug("POST /api/auth/refresh - Refreshing token");
        
        TokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Request password reset - generates token (always returns success to avoid email enumeration)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reset request processed")
    })
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody PasswordResetRequest request) {
        log.debug("POST /api/auth/forgot-password - Request for email: {}", request.getEmail());
        Map<String, Object> response = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Reset password using reset token")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Password reset successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid or expired token")
    })
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody PasswordReset request) {
        log.debug("POST /api/auth/reset-password - Reset with token");
        Map<String, Object> response = authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(response);
    }
}
