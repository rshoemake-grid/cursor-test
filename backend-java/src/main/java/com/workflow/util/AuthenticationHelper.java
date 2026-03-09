package com.workflow.util;

import com.workflow.entity.User;
import com.workflow.exception.ForbiddenException;
import com.workflow.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Utility class for extracting user information from Authentication
 * DRY: Centralizes user extraction logic used across controllers
 */
@Component
public class AuthenticationHelper {
    private final UserRepository userRepository;
    
    public AuthenticationHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * Extract user ID from Authentication
     * @param authentication Spring Security Authentication object
     * @return User ID or null if not authenticated
     */
    public String extractUserId(Authentication authentication) {
        return extractUser(authentication)
            .map(User::getId)
            .orElse(null);
    }

    /**
     * Extract user ID from Authentication, safely handling null
     * @param authentication Spring Security Authentication object (may be null)
     * @return User ID or null if not authenticated or authentication is null
     */
    public String extractUserIdNullable(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        return extractUserId(authentication);
    }

    /**
     * Extract user ID from Authentication; throws if not authenticated or user not found.
     * Use for endpoints that require authentication.
     */
    public String extractUserIdRequired(Authentication authentication) {
        String userId = extractUserId(authentication);
        if (userId == null) {
            throw new ForbiddenException("Authentication required");
        }
        return userId;
    }
    
    /**
     * Extract User entity from Authentication
     * @param authentication Spring Security Authentication object
     * @return Optional User or empty if not authenticated
     */
    public Optional<User> extractUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetails)) {
            return Optional.empty();
        }
        
        UserDetails userDetails = (UserDetails) principal;
        return userRepository.findByUsername(userDetails.getUsername());
    }
    
    /**
     * Extract username from Authentication.
     * @return username or null if not authenticated
     */
    public String extractUsername(Authentication authentication) {
        return extractUser(authentication)
                .map(User::getUsername)
                .orElse(null);
    }

    /**
     * Extract username from Authentication, safely handling null.
     * @return username or null if not authenticated or authentication is null
     */
    public String extractUsernameNullable(Authentication authentication) {
        return authentication == null ? null : extractUsername(authentication);
    }

    /**
     * Check if the authenticated user is an admin.
     * @return true if user is admin, false if not authenticated or not admin
     */
    public boolean extractIsAdmin(Authentication authentication) {
        return extractUser(authentication)
                .map(u -> Boolean.TRUE.equals(u.getIsAdmin()))
                .orElse(false);
    }

    /**
     * Check if user is authenticated
     * @param authentication Spring Security Authentication object
     * @return true if authenticated, false otherwise
     */
    public boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }
}
