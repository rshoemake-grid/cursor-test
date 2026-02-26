package com.workflow.util;

import com.workflow.entity.User;
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
     * Check if user is authenticated
     * @param authentication Spring Security Authentication object
     * @return true if authenticated, false otherwise
     */
    public boolean isAuthenticated(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated();
    }
}
