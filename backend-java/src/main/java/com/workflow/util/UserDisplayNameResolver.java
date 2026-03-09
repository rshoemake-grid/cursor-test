package com.workflow.util;

import com.workflow.entity.User;

import java.util.Optional;

/**
 * DRY-11: Centralizes user display name resolution.
 * Order: username -> fullName -> email.
 */
public final class UserDisplayNameResolver {

    private UserDisplayNameResolver() {
    }

    /**
     * Resolve display name from Optional user. Use when looking up by id.
     */
    public static String resolveFromOptional(Optional<User> userOpt) {
        return userOpt.map(UserDisplayNameResolver::resolve).orElse(null);
    }

    /**
     * Resolve display name for a user. Prefers username, then fullName, then email.
     *
     * @param user the user (may be null)
     * @return display name or null if user is null
     */
    public static String resolve(User user) {
        if (user == null) {
            return null;
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getEmail();
    }
}
